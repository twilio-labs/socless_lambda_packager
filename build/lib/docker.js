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
import { spawn } from 'child_process';
import { CUSTOM_DOCKERFILE_IMAGE_NAME } from './internal.js';
export function spawnDockerCmd(args) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, spawn('docker', args)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_1 = _a.sent();
                    if (e_1.stderrBuffer &&
                        e_1.stderrBuffer.toString().includes('command not found')) {
                        throw new Error('docker not found! Please install it.');
                    }
                    throw e_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Build the custom Docker image if user provides a dockerfile
 * @param {string} dockerFile
 * @param {string[]} extraArgs
 * @return {string} The name of the built docker image.
 */
export function buildImage(dockerFilePath, dockerExtraArgs) {
    if (dockerExtraArgs === void 0) { dockerExtraArgs = []; }
    return __awaiter(this, void 0, void 0, function () {
        var options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = [
                        'build',
                        '-f',
                        dockerFilePath,
                        '-t',
                        CUSTOM_DOCKERFILE_IMAGE_NAME,
                    ];
                    if (Array.isArray(dockerExtraArgs)) {
                        options.push.apply(options, dockerExtraArgs);
                    }
                    else {
                        throw new Error('dockerRunCmdExtraArgs option must be an array');
                    }
                    // TODO: whats this for?
                    options.push('.');
                    return [4 /*yield*/, spawnDockerCmd(options)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Find out what uid the docker machine is using
 */
function getDockerUid(bindPath) {
    return __awaiter(this, void 0, void 0, function () {
        var options, ps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = [
                        'run',
                        '--rm',
                        '-v',
                        "".concat(bindPath, ":/test"),
                        'alpine',
                        'stat',
                        '-c',
                        '%u',
                        '/bin/sh',
                    ];
                    return [4 /*yield*/, spawnDockerCmd(options)];
                case 1:
                    ps = _a.sent();
                    return [2 /*return*/, ps.stdout.toString().trim()];
            }
        });
    });
}
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
//# sourceMappingURL=docker.js.map