export default {
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      // useESM: true,
      diagnostics: {
        // https://kulshekhar.github.io/ts-jest/docs/getting-started/options/diagnostics
        warnOnly: true,
      },
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testRegex: '(__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
