import colors from 'colors/safe';

function showError(message) {
  console.error(colors.red('ERROR:') + ' ' + message);
}

function showInfo(message) {
  console.info(colors.green('INFO:') + ' ' + message);
}

export default { showError, showInfo };
