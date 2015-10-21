import colors from 'colors/safe';

import pkg from '../package.json';

function show(tag, mode, color) {
  return function showWrapper(...args) {
    const prefix = `${pkg.name} ` + colors[color](`${tag}:`);
    args.unshift(prefix);
    console[mode].apply(console, args);
  };
}

export const showError = show('ERRO', 'error', 'red');

export const showWarning = show('WARN', 'warn', 'yellow');

export const showInfo = show('INFO', 'info', 'green');

export const showVerbose = show('VERB', 'log', 'blue');
