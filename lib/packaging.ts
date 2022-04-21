import { Result, ok, err } from 'neverthrow';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import {
  customCopyDirSync,
  ensureDirSync,
  DEFAULT_FUNCTIONS_DIR_NAME,
  DEFAULT_OUTPUT_DIR_NAME,
  checkDirExists,
  getUTF8File,
  removeUndefinedValues,
} from './internal.js';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { DEFAULT_DOCKER_IMAGE } from './constants.js';
import { spawnDockerCmd } from './docker.js';
import * as path from 'path';
// import * as AppDir from 'appdirectory'; // works in jest, not cli
// import * as CRC32 from 'crc-32'; // works in jest, not cli
import AppDir from 'appdirectory';
import CRC32 from 'crc-32';
import { zip } from 'zip-a-folder';

export type useDockerOption = 'no-linux' | 'true' | 'false';
export type languageOption = 'python' | 'ts' | 'js';

export interface PackagingArgs {
  functionsDir: string;
  commonDir?: string;
  outputDir?: string;
  useDocker: useDockerOption;
  language: languageOption;
}

export const defaultPackagingArgs: PackagingArgs = {
  functionsDir: DEFAULT_FUNCTIONS_DIR_NAME,
  outputDir: DEFAULT_OUTPUT_DIR_NAME,
  // no common files directory by default
  commonDir: undefined,
  useDocker: 'no-linux',
  language: 'python',
};

function shouldUseDocker(useDockerChoice: useDockerOption): boolean {
  switch (useDockerChoice) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'no-linux':
      return process.platform !== 'linux';
  }
}

// does not handle non-pip installations (poetry, etc)
function getRequirementsFilePath(
  functionDirPath: string,
  language: languageOption,
): string {
  switch (language) {
    case 'python':
      return path.join(functionDirPath, 'requirements.txt');
    case 'ts':
      return path.join(functionDirPath, 'package.json');
    case 'js':
      return path.join(functionDirPath, 'package.json');
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

function checkArgErrors(args: PackagingArgs): Result<string, string> {
  // error check the args
  const functionsDirResult = checkDirExists(args.functionsDir);
  if (functionsDirResult.isErr()) {
    return err(
      `Directory of code to package does not exist: ${functionsDirResult.error}`,
    );
  }
  if (args.commonDir !== undefined) {
    const commonDirResult = checkDirExists(args.commonDir);
    if (commonDirResult.isErr()) {
      return err(
        `Directory of "common" code to include with all functions does not exist: ${commonDirResult.error}`,
      );
    }
  }
  if (args.language !== 'python') {
    return err(`Unsupported language: ${args.language}`);
  }

  return ok('');
}

export async function makePackages(args: PackagingArgs) {
  // use default args if not provided
  const argsPlusDefaults = {
    ...defaultPackagingArgs,
    ...removeUndefinedValues(args),
  };

  // error check the args
  const errors = checkArgErrors(argsPlusDefaults);
  if (errors.isErr()) throw new Error(errors.error);

  const { functionsDir, commonDir, outputDir, useDocker, language } =
    argsPlusDefaults;

  // get list of directories in the specified functions folder
  const functionDirs = readdirSync(functionsDir, {
    withFileTypes: true,
  }).filter((dir) => dir.isDirectory());

  ensureDirSync(outputDir);

  let commonRequirementsContents = '';

  // copy the common code to the archive directory
  if (commonDir !== undefined) {
    // get common reguirements file path
    const commonRequirementsFilePath = getRequirementsFilePath(
      commonDir,
      language,
    );

    const commonRequirementsFileQuery = getUTF8File(commonRequirementsFilePath);
    if (commonRequirementsFileQuery.isErr()) {
      throw new Error(
        `No common requirements file found in ${commonRequirementsFilePath}, Error reading common requirements file: ${commonRequirementsFileQuery.error}`,
      );
    } else {
      commonRequirementsContents = commonRequirementsFileQuery.value.trim();
    }
  }

  const downloadCacheDir = getDownloadCacheDir();
  ensureDirSync(downloadCacheDir);

  // for each lambda function, copy the lambda code plus common code to it's own archive folder
  // then use a checksum of the combined requirements file to see if we have an existing cache of dependencies
  // if cache not found, download new dependencies (possibly via Docker)
  // then save dependencies to cache and copy to lambda's archive folder
  for (const functionDir of functionDirs) {
    const moduleName = functionDir.name;
    process.stdout.write(`Packaging ${moduleName}...\n`);

    const moduleCodeDirPath = path.join(functionsDir, moduleName);
    const moduleArchiveDirPath = path.join(outputDir, moduleName);

    // delete and re-make the function's archive folder to ensure stale code is removed
    rmSync(moduleArchiveDirPath, { recursive: true, force: true });
    mkdirSync(moduleArchiveDirPath, { recursive: true });

    // copy the function code to the archive directory
    customCopyDirSync(moduleCodeDirPath, moduleArchiveDirPath);

    // get function requirements file contents before it is overwritten by common requirements
    const functionRequirementsFilePath = getRequirementsFilePath(
      moduleCodeDirPath,
      language,
    );

    let fnRequirementsContents = '';

    const fnRequirementsQuery = getUTF8File(functionRequirementsFilePath);
    if (fnRequirementsQuery.isErr()) {
      process.stdout.write(
        `No requirements file found in ${moduleCodeDirPath}\n`,
      );
    } else {
      fnRequirementsContents = fnRequirementsQuery.value.trim();
    }

    // copy the common code to the archive directory (which can wipe the existing requirements.txt)
    customCopyDirSync(commonDir, moduleArchiveDirPath);

    // if no requirements contents, continue to next lambda function
    if (fnRequirementsContents === '' && commonRequirementsContents === '') {
      continue;
    }

    // write the combined requirements file over the existing one
    const filteredCombinedRequirements = filterRequirements(
      `${commonRequirementsContents}\n${fnRequirementsContents}`,
    );

    writeFileSync(
      path.join(moduleArchiveDirPath, 'requirements.txt'),
      filteredCombinedRequirements,
      { encoding: 'utf8', flag: 'w' },
    );

    // combine the requirements files
    const reqsChecksum = CRC32.str(filteredCombinedRequirements);

    const reqsStaticCacheFolder = getRequirementsWorkingPath(
      reqsChecksum,
      'x86_64',
    );

    if (
      existsSync(reqsStaticCacheFolder) &&
      existsSync(path.join(reqsStaticCacheFolder, '.completed_requirements'))
    ) {
      // static cache exists, copy over the dependencies and skip downloading
      process.stdout.write(`Copying cached dependencies...\n`);
      customCopyDirSync(reqsStaticCacheFolder, moduleArchiveDirPath);
      continue;
    } else {
      // no static cache yet, or download was aborted without a .completed_requirements file
      rmSync(reqsStaticCacheFolder, { recursive: true, force: true });
      // create folder, copy combined requirements to it, install reqs
      ensureDirSync(reqsStaticCacheFolder);
      writeFileSync(
        path.join(reqsStaticCacheFolder, 'requirements.txt'),
        filteredCombinedRequirements,
        { encoding: 'utf8', flag: 'w' },
      );
    }

    let childProcessInstallReqs: ChildProcessWithoutNullStreams;

    if (shouldUseDocker(useDocker)) {
      process.stdout.write('USING DOCKER\n');
      // installation of reqs inside docker
      const pipDockerCmds = [
        'python',
        '-m',
        'pip',
        'install',
        '-t',
        '/var/task/',
        '-r',
        '/var/task/requirements.txt',
        '--cache-dir',
        '/var/useDownloadCache',
      ];

      // ! if custom image
      // buildImage(customDockerfile)
      // const imageName = CUSTOM_IMAGE_NAME
      // path.join(process.cwd(), moduleArchiveDirPath);

      const dockerCmds = [
        'run',
        '--rm',
        '-v',
        `${reqsStaticCacheFolder}:/var/task:z`,
        '-v',
        `${downloadCacheDir}:/var/useDownloadCache:z`,
        DEFAULT_DOCKER_IMAGE,
        ...pipDockerCmds,
      ];

      childProcessInstallReqs = await spawnDockerCmd(dockerCmds);
    } else {
      process.stdout.write('NOT USING DOCKER\n');
      // not using docker
      childProcessInstallReqs = spawn('pip', [
        'install',
        '-r',
        path.join(reqsStaticCacheFolder, '/requirements.txt'),
        '-t',
        reqsStaticCacheFolder,
        '--cache-dir',
        downloadCacheDir,
      ]);
    }

    const exitCode = await attachLogHandlersAndGetExitCode(
      childProcessInstallReqs,
    );
    if (exitCode) {
      throw new Error(`subprocess error exit ${exitCode}`);
    } else {
      // add file to indicate this cache was created successfully
      closeSync(
        openSync(
          path.join(reqsStaticCacheFolder, '.completed_requirements'),
          'w',
        ),
      );

      // copy working requirements folder to archive dir
      customCopyDirSync(reqsStaticCacheFolder, moduleArchiveDirPath);
    }
  }

  // zip lambda functions into archive files
  await Promise.all(
    functionDirs.map((functionDir) => {
      const moduleArchiveDirPath = path.join(outputDir, functionDir.name);
      const zipFileName = `${functionDir.name}.zip`;

      const zipFilePath = path.join(outputDir, zipFileName);

      return zip(moduleArchiveDirPath, zipFilePath);
    }),
  );
}

// https://github.com/MrJohz/appdirectory
function getUserCacheDir(): string {
  const dirs = new AppDir({
    appName: 'lambda-packager',
    appAuthor: 'noxasaxon',
  });

  return dirs.userCache();
}

function getRequirementsWorkingPath(
  reqsHash: number,
  architecture: string,
): string {
  return path.join(getUserCacheDir(), `${reqsHash}_${architecture}_lambda_pkg`);
}

function getDownloadCacheDir(): string {
  return path.join(getUserCacheDir(), 'downloadCacheLambdaPkg');
}

async function attachLogHandlersAndGetExitCode(
  childProcess: ChildProcessWithoutNullStreams,
  // ): ChildProcessWithoutNullStreams {
): Promise<unknown> {
  childProcess.stdout.on('data', (data) => {
    process.stdout.write(`${data}`);
  });

  childProcess.stderr.on('data', (data) => {
    const dataAsString = data.toString();
    if (dataAsString.includes('command not found')) {
      throw new Error('docker not found! Please install it.');
    } else if (dataAsString.includes('Cannot connect to the Docker daemon')) {
      throw new Error('Docker daemon not running! Please start it.');
    } else if (dataAsString.includes('WARNING: You are using pip version')) {
      // do nothing
    } else {
      console.error(dataAsString);
    }
  });

  const exitCode = await new Promise((resolve) => {
    childProcess.on('close', resolve);
  });

  return exitCode;
}

/** create a filtered requirements.txt without anything from noDeploy
 *  then remove all comments and empty lines, and sort the list which
 *  assist with matching the static cache.  The sorting will skip any
 *  lines starting with -- as those are typically ordered at the
 *  start of a file ( eg: --index-url / --extra-index-url ) or any
 *  lines that start with -c, -e, -f, -i or -r,  Please see:
 * https://pip.pypa.io/en/stable/reference/pip_install/#requirements-file-format
 */
function filterRequirements(source: string): string {
  const requirements = source
    .replace(/\\\n/g, ' ')
    .split(/\r?\n/)
    .reduce((acc, req) => {
      req = req.trim();
      return [...acc, req];
      //! not supporting nested requirements files (-r in a requirements.txt) right now
      // if (!req.startsWith('-r')) {
      //   return [...acc, req];
      // }
      // source = path.join(path.dirname(source), req.replace(/^-r\s+/, ''));
      // return [...acc, ...getRequirements(source)];
    }, []);

  const prepend = [];
  const filteredRequirements = requirements.filter((req) => {
    req = req.trim();
    if (req.startsWith('#')) {
      // Skip comments
      return false;
    } else if (
      req.startsWith('--') ||
      req.startsWith('-c') ||
      req.startsWith('-e') ||
      req.startsWith('-f') ||
      req.startsWith('-i') ||
      req.startsWith('-r')
    ) {
      if (req.startsWith('-e')) {
        // strip out editable flags
        // not required inside final archive and avoids pip bugs
        // see https://github.com/UnitedIncome/serverless-python-requirements/issues/240
        req = req.split('-e')[1].trim();
      }

      // Keep options for later
      prepend.push(req);
      return false;
    } else if (req === '') {
      return false;
    }
    // return !noDeploy.has(req.split(/[=<> \t]/)[0].trim());
    return true;
  });

  filteredRequirements.sort(); // Sort remaining alphabetically
  // Then prepend any options from above in the same order
  for (const item of prepend.reverse()) {
    if (item && item.length > 0) {
      filteredRequirements.unshift(item);
    }
  }

  return filteredRequirements.join('\n') + '\n';
}
