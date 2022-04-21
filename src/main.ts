// Copyright (c) 2022 Twilio Inc.
import {
  command,
  run,
  string,
  // number,
  positional,
  option,
  optional,
} from 'cmd-ts';
import { ArgParser } from 'cmd-ts/dist/cjs/argparser';
import { ProvidesHelp } from 'cmd-ts/dist/cjs/helpdoc';
import {
  PackagingArgs,
  makePackages,
  defaultPackagingArgs,
} from '../lib/index.js';

type GenericCmdArgs<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof Required<T>]: ArgParser<any> & Partial<ProvidesHelp>;
};

const PackagingCmdArgs: GenericCmdArgs<PackagingArgs> = {
  functionsDir: positional({
    displayName: 'functionsDir',
    description: 'functions directory',
  }),
  commonDir: option({
    type: optional(string),
    long: 'common',
    short: 'c',
    description: 'common shared code directory path',
  }),
  outputDir: option({
    type: {
      ...string,
      defaultValue: () => defaultPackagingArgs.outputDir,
      defaultValueIsSerializable: true,
    },
    long: 'output',
    short: 'o',
    description: 'output directory for archive files',
  }),
  useDocker: option({
    type: {
      ...string,
      defaultValue: () => defaultPackagingArgs.useDocker,

      defaultValueIsSerializable: true,
    },
    long: 'useDocker',
    short: 'u',
    description: "'no-linux' or 'true' or 'false'",
  }),
  language: option({
    type: {
      ...string,
      defaultValue: () => defaultPackagingArgs.language,
      defaultValueIsSerializable: true,
    },

    long: 'language',
    short: 'l',
    description: 'programming language of the code to package',
  }),
};

// get input using cmd-ts
const myCmd = command({
  name: 'lambda-packager',

  args: PackagingCmdArgs,
  handler: (args) => {
    if (args.useDocker === true) {
      args.useDocker = 'true';
    } else if (args.useDocker === false) {
      args.useDocker = 'false';
    }

    makePackages(args);
  },
});

async function main() {
  await run(myCmd, process.argv.slice(2));
}

main();
