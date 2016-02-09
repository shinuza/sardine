import Sardine from '../../lib';

function init(directory) {
  return Sardine.init(directory).then((missing) => {
    if(missing) {
      return Sardine.onInitSuccess();
    }
    return Sardine.onInitNoop();
  });
}

export default init;
