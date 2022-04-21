import * as path from 'path';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  readFileSync,
} from 'fs';
import { err, ok, Result } from 'neverthrow';

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
  const filePaths = readdirSync(directory);

  filePaths.forEach((fPath) => {
    const source = path.join(directory, fPath);
    const dest = path.join(destination, fPath);
    const stat = statSync(source);

    if (stat.isDirectory()) {
      ensureDirSync(dest);
      customCopyDirSync(source, dest);
    } else {
      copyFileSync(source, dest);
    }
  });
}

export function getUTF8File(filePath: string): Result<string, string> {
  if (!existsSync(filePath)) {
    return err(`File not found: ${filePath}`);
  }

  const fileContents = readFileSync(filePath, 'utf8');

  return ok(fileContents);
}

export function checkDirExists(dir: string): Result<string, string> {
  if (!existsSync(dir)) {
    return err(`${dir} does not exist`);
  }
  return ok(dir);
}

export function removeUndefinedValues<T>(obj: T): T {
  // Object.keys(args).forEach(
  //   (key) => args[key] === undefined && delete args[key],
  // );
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });

  return newObj as T;
}

// /**
//  * Omit empty commands.
//  * In this context, a "command" is a list of arguments. An empty list or falsy value is ommitted.
//  */
// function filterCommands(commands: string[][]): string[][] {
//   return commands.filter((cmd) => Boolean(cmd) && cmd.length > 0);
// }

// /**
//  * Render zero or more commands as a single command for a Unix environment.
//  * In this context, a "command" is a list of arguments. An empty list or falsy value is ommitted.
//  *
//  * @param {string[][]} many commands to merge.
//  * @return {string[]} a single list of words.
//  */
// function mergeCommands(commands: string[][]): string[] {
//   const cmds = filterCommands(commands);
//   if (cmds.length === 0) {
//     throw new Error('Expected at least one non-empty command');
//   } else if (cmds.length === 1) {
//     return cmds[0];
//   } else {
//     // Quote the arguments in each command and join them all using &&.
//     const script = cmds.map(quote).join(' && ');
//     return ['/bin/sh', '-c', script];
//   }
// }

// https://github.com/substack/node-shell-quote/blob/master/index.js
export const quote = function (xs) {
  return xs
    .map(function (s) {
      if (s && typeof s === 'object') {
        return s.op.replace(/(.)/g, '\\$1');
      } else if (/["\s]/.test(s) && !/'/.test(s)) {
        return "'" + s.replace(/(['\\])/g, '\\$1') + "'";
      } else if (/["'\s]/.test(s)) {
        return '"' + s.replace(/(["\\$`!])/g, '\\$1') + '"';
      } else {
        return String(s).replace(
          // eslint-disable-next-line no-useless-escape
          /([A-Za-z]:)?([#!"$&'()*,:;<=>?@\[\\\]^`{|}])/g,
          '$1\\$2',
        );
      }
    })
    .join(' ');
};
