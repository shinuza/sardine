import colors from 'colors/safe';

import pkg from '../package.json';

function show(tag, mode, color) {
  return function showWrapper(...args) {
    const prefix = `${pkg.name} ` + colors[color](`${tag}:`);
    args.unshift(prefix);
    console[mode].apply(console, args);
  };
}

const showError = show('ERRO', 'error', 'red');

const showWarning = show('WARN', 'warn', 'yellow');

const showInfo = show('INFO', 'info', 'green');

const showVerbose = show('VERB', 'log', 'blue');

export default {
  showError,
  showInfo,
  showVerbose,
  showWarning,
};
