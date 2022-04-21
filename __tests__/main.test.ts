import * as path from 'path';
import {
  DEFAULT_FUNCTIONS_DIR_NAME,
  makePackages,
  defaultPackagingArgs,
} from '../lib/internal';

const TESTING_ARTIFACTS_PATH = path.join(__dirname, './.testing_artifacts');

const MOCK_REPO_PATH = path.join(__dirname, './mock_repo');

describe('makePackages', () => {
  it('should be run', async () => {
    const pkgArgs = defaultPackagingArgs;
    pkgArgs.functionsDir = path.join(
      MOCK_REPO_PATH,
      DEFAULT_FUNCTIONS_DIR_NAME,
    );
    pkgArgs.commonDir = path.join(MOCK_REPO_PATH, 'common');
    pkgArgs.outputDir = path.join(TESTING_ARTIFACTS_PATH, '.archives');
    pkgArgs.useDocker = 'false';

    // run function
    await makePackages(pkgArgs);

    expect('test').toBe('test');
  });
});
