import colors from 'colors/safe';

function showError(message) {
  console.error(colors.red('ERRO:') + ' ' + message);
}

function showInfo(message) {
  console.info(colors.green('INFO:') + ' ' + message);
}

function showVerbose(message) {
  console.info(colors.blue('VERB:') + ' ' + message);
}

export default { showError, showInfo, showVerbose };
