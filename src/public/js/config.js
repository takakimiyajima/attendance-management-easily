// localStorageの設定
const config = () => {
  const set = (key, val) => {
    return new Promise((resolve, reject) => {
      console.log('config.set', key, val);
      const pair = {};
      pair[key] = val;
      chrome.storage.sync.set(pair, resolve);
    });
  }

  const get = (key) => {
    return new Promise((resolve, reject) => {
      console.log('config.get', key);
      chrome.storage.sync.get([key], (res) => {
          resolve(res[key]);
      });
    });
  };

  const setLocal = (key, val) => {
    return new Promise((resolve, reject) => {
      console.log('config.setLocal', key, val);
      const pair = {};
      pair[key] = val;
      chrome.storage.local.set(pair, resolve);
    });
  };

  const getLocal = (key) => {
    return new Promise((resolve, reject) => {
      // console.log('config.getLocal', key);
      chrome.storage.local.get([key], (res) => {
          resolve(res[key]);
      });
    });
  };

  const clearLocal = () => {
    return new Promise((resolve, reject) => {
      console.log('config.clearLocal');
      chrome.storage.local.clear(resolve);
    });
  }

  return {
    set, get, setLocal, getLocal, clearLocal
  };
}
