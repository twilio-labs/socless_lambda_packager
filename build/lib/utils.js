import * as path from 'path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, readFileSync, } from 'fs';
import { err, ok } from 'neverthrow';
// fs-extra isn't converted to ESM syntax, so we need to use regular fs
// https://ar.al/2021/03/07/fs-extra-to-fs/
export function ensureDirSync(directory) {
    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
    }
}
// fs-extra isn't converted to ESM syntax, so we need to use regular fs
// https://ar.al/2021/03/07/fs-extra-to-fs/
export function customCopyDirSync(directory, destination) {
    var filePaths = readdirSync(directory);
    filePaths.forEach(function (fPath) {
        var source = path.join(directory, fPath);
        var dest = path.join(destination, fPath);
        var stat = statSync(source);
        if (stat.isDirectory()) {
            ensureDirSync(dest);
            customCopyDirSync(source, dest);
        }
        else {
            copyFileSync(source, dest);
        }
    });
}
export function getUTF8File(filePath) {
    if (!existsSync(filePath)) {
        return err("File not found: ".concat(filePath));
    }
    var fileContents = readFileSync(filePath, 'utf8');
    return ok(fileContents);
}
export function checkDirExists(dir) {
    if (!existsSync(dir)) {
        return err("".concat(dir, " does not exist"));
    }
    return ok(dir);
}
export function removeUndefinedValues(obj) {
    // Object.keys(args).forEach(
    //   (key) => args[key] === undefined && delete args[key],
    // );
    var newObj = {};
    Object.keys(obj).forEach(function (key) {
        if (obj[key] !== undefined) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
}
/**
 * Omit empty commands.
 * In this context, a "command" is a list of arguments. An empty list or falsy value is ommitted.
 */
function filterCommands(commands) {
    return commands.filter(function (cmd) { return Boolean(cmd) && cmd.length > 0; });
}
/**
 * Render zero or more commands as a single command for a Unix environment.
 * In this context, a "command" is a list of arguments. An empty list or falsy value is ommitted.
 *
 * @param {string[][]} many commands to merge.
 * @return {string[]} a single list of words.
 */
function mergeCommands(commands) {
    var cmds = filterCommands(commands);
    if (cmds.length === 0) {
        throw new Error('Expected at least one non-empty command');
    }
    else if (cmds.length === 1) {
        return cmds[0];
    }
    else {
        // Quote the arguments in each command and join them all using &&.
        var script = cmds.map(quote).join(' && ');
        return ['/bin/sh', '-c', script];
    }
}
// https://github.com/substack/node-shell-quote/blob/master/index.js
export var quote = function (xs) {
    return xs
        .map(function (s) {
        if (s && typeof s === 'object') {
            return s.op.replace(/(.)/g, '\\$1');
        }
        else if (/["\s]/.test(s) && !/'/.test(s)) {
            return "'" + s.replace(/(['\\])/g, '\\$1') + "'";
        }
        else if (/["'\s]/.test(s)) {
            return '"' + s.replace(/(["\\$`!])/g, '\\$1') + '"';
        }
        else {
            return String(s).replace(
            // eslint-disable-next-line no-useless-escape
            /([A-Za-z]:)?([#!"$&'()*,:;<=>?@\[\\\]^`{|}])/g, '$1\\$2');
        }
    })
        .join(' ');
};
//# sourceMappingURL=utils.js.map