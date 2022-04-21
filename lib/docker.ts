import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { CUSTOM_DOCKERFILE_IMAGE_NAME } from './internal.js';

export async function spawnDockerCmd(
  args: string[],
): Promise<ChildProcessWithoutNullStreams> {
  try {
    return await spawn('docker', args);
  } catch (e) {
    if (
      e.stderrBuffer &&
      e.stderrBuffer.toString().includes('command not found')
    ) {
      throw new Error('docker not found! Please install it.');
    }
    throw e;
  }
}

/**
 * Build the custom Docker image if user provides a dockerfile
 * @param {string} dockerFile
 * @param {string[]} extraArgs
 * @return {string} The name of the built docker image.
 */
export async function buildImage(
  dockerFilePath: string,
  dockerExtraArgs: string[] = [],
) {
  const options = [
    'build',
    '-f',
    dockerFilePath,
    '-t',
    CUSTOM_DOCKERFILE_IMAGE_NAME,
  ];

  if (Array.isArray(dockerExtraArgs)) {
    options.push(...dockerExtraArgs);
  } else {
    throw new Error('dockerRunCmdExtraArgs option must be an array');
  }

  // TODO: whats this for?
  options.push('.');

  return await spawnDockerCmd(options);
}

// /**
//  * Find out what uid the docker machine is using
//  */
// async function getDockerUid(bindPath: string) {
//   const options = [
//     'run',
//     '--rm',
//     '-v',
//     `${bindPath}:/test`,
//     'alpine',
//     'stat',
//     '-c',
//     '%u',
//     '/bin/sh',
//   ];
//   const ps = await spawnDockerCmd(options);
//   return ps.stdout.toString().trim();
// }

// //! Windows stuff, not supported currently
// /**
//  * Get bind path depending on os platform
//  * @param {object} serverless
//  * @param {string} servicePath
//  * @return {string} The bind path.
//  */
// export async function getBindPath(servicePath: string) {
//   // Determine bind path
//   const isWsl1 = isWsl && !os.release().includes('microsoft-standard');
//   if (process.platform !== 'win32' && !isWsl1) {
//     return servicePath;
//   }

//   // test docker is available
//   await spawnDockerCmd(['version']);

//   // find good bind path for Windows
//   const bindPaths = [];
//   let baseBindPath = servicePath.replace(/\\([^\s])/g, '/$1');
//   let drive;
//   let path;

//   bindPaths.push(baseBindPath);
//   if (baseBindPath.startsWith('/mnt/')) {
//     // cygwin "/mnt/C/users/..."
//     baseBindPath = baseBindPath.replace(/^\/mnt\//, '/');
//   }
//   if (baseBindPath[1] == ':') {
//     // normal windows "c:/users/..."
//     drive = baseBindPath[0];
//     path = baseBindPath.substring(3);
//   } else if (baseBindPath[0] == '/' && baseBindPath[2] == '/') {
//     // gitbash "/c/users/..."
//     drive = baseBindPath[1];
//     path = baseBindPath.substring(3);
//   } else {
//     throw new Error(`Unknown path format ${baseBindPath.substr(10)}...`);
//   }

//   bindPaths.push(`/${drive.toLowerCase()}/${path}`); // Docker Toolbox (seems like Docker for Windows can support this too)
//   bindPaths.push(`${drive.toLowerCase()}:/${path}`); // Docker for Windows
//   // other options just in case
//   bindPaths.push(`/${drive.toUpperCase()}/${path}`);
//   bindPaths.push(`/mnt/${drive.toLowerCase()}/${path}`);
//   bindPaths.push(`/mnt/${drive.toUpperCase()}/${path}`);
//   bindPaths.push(`${drive.toUpperCase()}:/${path}`);

//   const testFile = findTestFile(servicePath);

//   for (let i = 0; i < bindPaths.length; i++) {
//     const bindPath = bindPaths[i];
//     if (await tryBindPath(bindPath, testFile)) {
//       return bindPath;
//     }
//   }

//   throw new Error('Unable to find good bind path format');
// }

// // https://github.com/sindresorhus/is-wsl/blob/main/index.js
// const isWsl = () => {
//   if (process.platform !== 'linux') {
//     return false;
//   }

//   if (os.release().toLowerCase().includes('microsoft')) {
//     if (isDocker()) {
//       return false;
//     }

//     return true;
//   }

//   try {
//     return readFileSync('/proc/version', 'utf8')
//       .toLowerCase()
//       .includes('microsoft')
//       ? !isDocker()
//       : false;
//   } catch (_) {
//     return false;
//   }
// };

// // https://github.com/sindresorhus/is-docker/blob/main/index.js
// let isDockerCached;
// function hasDockerEnv() {
//   try {
//     statSync('/.dockerenv');
//     return true;
//   } catch {
//     return false;
//   }
// }
// function hasDockerCGroup() {
//   try {
//     return readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
//   } catch {
//     return false;
//   }
// }

// export default function isDocker() {
//   // TODO: Use `??=` when targeting Node.js 16.
//   if (isDockerCached === undefined) {
//     isDockerCached = hasDockerEnv() || hasDockerCGroup();
//   }

//   return isDockerCached;
// }
