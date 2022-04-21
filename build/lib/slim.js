// const glob = require('glob-all');
var getStripMode = function (stripOption, slimOption, dockerizePip) {
    if (stripOption === false ||
        stripOption === 'false' ||
        slimOption === false ||
        slimOption === 'false') {
        return 'skip';
    }
    else if (dockerizePip) {
        return 'docker';
    }
    else if (
    // (!isWsl && process.platform === 'win32') ||
    process.platform === 'win32' ||
        process.platform === 'darwin') {
        return 'skip';
    }
    else {
        return 'direct';
    }
};
var getStripCommand = function (folderPath) { return [
    'find',
    folderPath,
    '-name',
    '*.so',
    '-exec',
    'strip',
    '{}',
    ';',
]; };
// const deleteFiles = (options, folderPath) => {
//   let patterns = ['**/*.py[c|o]', '**/__pycache__*', '**/*.dist-info*'];
//   if (options.slimPatterns) {
//     if (
//       options.slimPatternsAppendDefaults === false ||
//       options.slimPatternsAppendDefaults == 'false'
//     ) {
//       patterns = options.slimPatterns;
//     } else {
//       patterns = patterns.concat(options.slimPatterns);
//     }
//   }
//   for (const pattern of patterns) {
//     for (const file of glob.sync(`${folderPath}/${pattern}`)) {
//       fse.removeSync(file);
//     }
//   }
// };
module.exports = {
    getStripMode: getStripMode,
    getStripCommand: getStripCommand
};
//# sourceMappingURL=slim.js.map