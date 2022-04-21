var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { ok, err } from 'neverthrow';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, rmSync, writeFileSync, } from 'fs';
import { customCopyDirSync, ensureDirSync, DEFAULT_FUNCTIONS_DIR_NAME, DEFAULT_OUTPUT_DIR_NAME, checkDirExists, getUTF8File, removeUndefinedValues, } from './internal.js';
import { spawn } from 'child_process';
import { DEFAULT_DOCKER_IMAGE } from './constants.js';
import { spawnDockerCmd } from './docker.js';
import * as path from 'path';
// import * as AppDir from 'appdirectory'; // works in jest, not cli
// import * as CRC32 from 'crc-32'; // works in jest, not cli
import AppDir from 'appdirectory';
import CRC32 from 'crc-32';
import { zip } from 'zip-a-folder';
export var defaultPackagingArgs = {
    functionsDir: DEFAULT_FUNCTIONS_DIR_NAME,
    outputDir: DEFAULT_OUTPUT_DIR_NAME,
    // no common files directory by default
    commonDir: undefined,
    useDocker: 'no-linux',
    language: 'python'
};
function shouldUseDocker(useDockerChoice) {
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
function getRequirementsFilePath(functionDirPath, language) {
    switch (language) {
        case 'python':
            return path.join(functionDirPath, 'requirements.txt');
        case 'ts':
            return path.join(functionDirPath, 'package.json');
        case 'js':
            return path.join(functionDirPath, 'package.json');
        default:
            throw new Error("Unsupported language: ".concat(language));
    }
}
function checkArgErrors(args) {
    // error check the args
    var functionsDirResult = checkDirExists(args.functionsDir);
    if (functionsDirResult.isErr()) {
        return err("Directory of code to package does not exist: ".concat(functionsDirResult.error));
    }
    if (args.commonDir !== undefined) {
        var commonDirResult = checkDirExists(args.commonDir);
        if (commonDirResult.isErr()) {
            return err("Directory of \"common\" code to include with all functions does not exist: ".concat(commonDirResult.error));
        }
    }
    if (args.language !== 'python') {
        return err("Unsupported language: ".concat(args.language));
    }
    return ok('');
}
export function makePackages(args) {
    return __awaiter(this, void 0, void 0, function () {
        var argsPlusDefaults, errors, functionsDir, commonDir, outputDir, useDocker, language, functionDirs, commonRequirementsContents, commonRequirementsFilePath, commonRequirementsFileQuery, downloadCacheDir, _i, functionDirs_1, functionDir, moduleName, moduleCodeDirPath, moduleArchiveDirPath, functionRequirementsFilePath, fnRequirementsContents, fnRequirementsQuery, filteredCombinedRequirements, reqsChecksum, reqsStaticCacheFolder, childProcessInstallReqs, pipDockerCmds, dockerCmds, exitCode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    argsPlusDefaults = __assign(__assign({}, defaultPackagingArgs), removeUndefinedValues(args));
                    errors = checkArgErrors(argsPlusDefaults);
                    if (errors.isErr())
                        throw new Error(errors.error);
                    functionsDir = argsPlusDefaults.functionsDir, commonDir = argsPlusDefaults.commonDir, outputDir = argsPlusDefaults.outputDir, useDocker = argsPlusDefaults.useDocker, language = argsPlusDefaults.language;
                    functionDirs = readdirSync(functionsDir, {
                        withFileTypes: true
                    }).filter(function (dir) { return dir.isDirectory(); });
                    ensureDirSync(outputDir);
                    commonRequirementsContents = '';
                    // copy the common code to the archive directory
                    if (commonDir !== undefined) {
                        commonRequirementsFilePath = getRequirementsFilePath(commonDir, language);
                        commonRequirementsFileQuery = getUTF8File(commonRequirementsFilePath);
                        if (commonRequirementsFileQuery.isErr()) {
                            throw new Error("No common requirements file found in ".concat(commonRequirementsFilePath, ", Error reading common requirements file: ").concat(commonRequirementsFileQuery.error));
                        }
                        else {
                            commonRequirementsContents = commonRequirementsFileQuery.value.trim();
                        }
                    }
                    downloadCacheDir = getDownloadCacheDir();
                    ensureDirSync(downloadCacheDir);
                    _i = 0, functionDirs_1 = functionDirs;
                    _a.label = 1;
                case 1:
                    if (!(_i < functionDirs_1.length)) return [3 /*break*/, 7];
                    functionDir = functionDirs_1[_i];
                    moduleName = functionDir.name;
                    process.stdout.write("Packaging ".concat(moduleName, "...\n"));
                    moduleCodeDirPath = path.join(functionsDir, moduleName);
                    moduleArchiveDirPath = path.join(outputDir, moduleName);
                    // delete and re-make the function's archive folder to ensure stale code is removed
                    rmSync(moduleArchiveDirPath, { recursive: true, force: true });
                    mkdirSync(moduleArchiveDirPath, { recursive: true });
                    // copy the function code to the archive directory
                    customCopyDirSync(moduleCodeDirPath, moduleArchiveDirPath);
                    functionRequirementsFilePath = getRequirementsFilePath(moduleCodeDirPath, language);
                    fnRequirementsContents = '';
                    fnRequirementsQuery = getUTF8File(functionRequirementsFilePath);
                    if (fnRequirementsQuery.isErr()) {
                        process.stdout.write("No requirements file found in ".concat(moduleCodeDirPath, "\n"));
                    }
                    else {
                        fnRequirementsContents = fnRequirementsQuery.value.trim();
                    }
                    // copy the common code to the archive directory (which can wipe the existing requirements.txt)
                    customCopyDirSync(commonDir, moduleArchiveDirPath);
                    // if no requirements contents, continue to next lambda function
                    if (fnRequirementsContents === '' && commonRequirementsContents === '') {
                        return [3 /*break*/, 6];
                    }
                    filteredCombinedRequirements = filterRequirements("".concat(commonRequirementsContents, "\n").concat(fnRequirementsContents));
                    writeFileSync(path.join(moduleArchiveDirPath, 'requirements.txt'), filteredCombinedRequirements, { encoding: 'utf8', flag: 'w' });
                    reqsChecksum = CRC32.str(filteredCombinedRequirements);
                    reqsStaticCacheFolder = getRequirementsWorkingPath(reqsChecksum, 'x86_64');
                    if (existsSync(reqsStaticCacheFolder) &&
                        existsSync(path.join(reqsStaticCacheFolder, '.completed_requirements'))) {
                        // static cache exists, copy over the dependencies and skip downloading
                        process.stdout.write("Copying cached dependencies...\n");
                        customCopyDirSync(reqsStaticCacheFolder, moduleArchiveDirPath);
                        return [3 /*break*/, 6];
                    }
                    else {
                        // no static cache yet, or download was aborted without a .completed_requirements file
                        rmSync(reqsStaticCacheFolder, { recursive: true, force: true });
                        // create folder, copy combined requirements to it, install reqs
                        ensureDirSync(reqsStaticCacheFolder);
                        writeFileSync(path.join(reqsStaticCacheFolder, 'requirements.txt'), filteredCombinedRequirements, { encoding: 'utf8', flag: 'w' });
                    }
                    childProcessInstallReqs = void 0;
                    if (!shouldUseDocker(useDocker)) return [3 /*break*/, 3];
                    process.stdout.write('USING DOCKER\n');
                    pipDockerCmds = [
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
                    dockerCmds = __spreadArray([
                        'run',
                        '--rm',
                        '-v',
                        "".concat(reqsStaticCacheFolder, ":/var/task:z"),
                        '-v',
                        "".concat(downloadCacheDir, ":/var/useDownloadCache:z"),
                        DEFAULT_DOCKER_IMAGE
                    ], pipDockerCmds, true);
                    return [4 /*yield*/, spawnDockerCmd(dockerCmds)];
                case 2:
                    childProcessInstallReqs = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
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
                    _a.label = 4;
                case 4: return [4 /*yield*/, attachLogHandlersAndGetExitCode(childProcessInstallReqs)];
                case 5:
                    exitCode = _a.sent();
                    if (exitCode) {
                        throw new Error("subprocess error exit ".concat(exitCode));
                    }
                    else {
                        // add file to indicate this cache was created successfully
                        closeSync(openSync(path.join(reqsStaticCacheFolder, '.completed_requirements'), 'w'));
                        // copy working requirements folder to archive dir
                        customCopyDirSync(reqsStaticCacheFolder, moduleArchiveDirPath);
                    }
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: 
                // zip lambda functions into archive files
                return [4 /*yield*/, Promise.all(functionDirs.map(function (functionDir) {
                        var moduleArchiveDirPath = path.join(outputDir, functionDir.name);
                        var zipFileName = "".concat(functionDir.name, ".zip");
                        var zipFilePath = path.join(outputDir, zipFileName);
                        return zip(moduleArchiveDirPath, zipFilePath);
                    }))];
                case 8:
                    // zip lambda functions into archive files
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// https://github.com/MrJohz/appdirectory
function getUserCacheDir() {
    var dirs = new AppDir({
        appName: 'lambda-packager',
        appAuthor: 'noxasaxon'
    });
    return dirs.userCache();
}
function getRequirementsWorkingPath(reqsHash, architecture) {
    return path.join(getUserCacheDir(), "".concat(reqsHash, "_").concat(architecture, "_lambda_pkg"));
}
function getDownloadCacheDir() {
    return path.join(getUserCacheDir(), 'downloadCacheLambdaPkg');
}
function attachLogHandlersAndGetExitCode(childProcess) {
    return __awaiter(this, void 0, void 0, function () {
        var exitCode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    childProcess.stdout.on('data', function (data) {
                        process.stdout.write("".concat(data));
                    });
                    childProcess.stderr.on('data', function (data) {
                        var dataAsString = data.toString();
                        if (dataAsString.includes('command not found')) {
                            throw new Error('docker not found! Please install it.');
                        }
                        else if (dataAsString.includes('Cannot connect to the Docker daemon')) {
                            throw new Error('Docker daemon not running! Please start it.');
                        }
                        else if (dataAsString.includes('WARNING: You are using pip version')) {
                            // do nothing
                        }
                        else {
                            console.error(dataAsString);
                        }
                    });
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            childProcess.on('close', resolve);
                        })];
                case 1:
                    exitCode = _a.sent();
                    return [2 /*return*/, exitCode];
            }
        });
    });
}
/** create a filtered requirements.txt without anything from noDeploy
 *  then remove all comments and empty lines, and sort the list which
 *  assist with matching the static cache.  The sorting will skip any
 *  lines starting with -- as those are typically ordered at the
 *  start of a file ( eg: --index-url / --extra-index-url ) or any
 *  lines that start with -c, -e, -f, -i or -r,  Please see:
 * https://pip.pypa.io/en/stable/reference/pip_install/#requirements-file-format
 */
function filterRequirements(source) {
    var requirements = source
        .replace(/\\\n/g, ' ')
        .split(/\r?\n/)
        .reduce(function (acc, req) {
        req = req.trim();
        return __spreadArray(__spreadArray([], acc, true), [req], false);
        //! not supporting nested requirements files (-r in a requirements.txt) right now
        // if (!req.startsWith('-r')) {
        //   return [...acc, req];
        // }
        // source = path.join(path.dirname(source), req.replace(/^-r\s+/, ''));
        // return [...acc, ...getRequirements(source)];
    }, []);
    var prepend = [];
    var filteredRequirements = requirements.filter(function (req) {
        req = req.trim();
        if (req.startsWith('#')) {
            // Skip comments
            return false;
        }
        else if (req.startsWith('--') ||
            req.startsWith('-c') ||
            req.startsWith('-e') ||
            req.startsWith('-f') ||
            req.startsWith('-i') ||
            req.startsWith('-r')) {
            if (req.startsWith('-e')) {
                // strip out editable flags
                // not required inside final archive and avoids pip bugs
                // see https://github.com/UnitedIncome/serverless-python-requirements/issues/240
                req = req.split('-e')[1].trim();
            }
            // Keep options for later
            prepend.push(req);
            return false;
        }
        else if (req === '') {
            return false;
        }
        // return !noDeploy.has(req.split(/[=<> \t]/)[0].trim());
        return true;
    });
    filteredRequirements.sort(); // Sort remaining alphabetically
    // Then prepend any options from above in the same order
    for (var _i = 0, _a = prepend.reverse(); _i < _a.length; _i++) {
        var item = _a[_i];
        if (item && item.length > 0) {
            filteredRequirements.unshift(item);
        }
    }
    return filteredRequirements.join('\n') + '\n';
}
//# sourceMappingURL=packaging.js.map