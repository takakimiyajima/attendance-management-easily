// 持っておきたいlocalStorageのキー
const configKeys = ['loginCode', 'manager', 'latitude', 'longitude', 'autostampMode', 'autostampCustomCode'];
const configLocalKeys = ['execAutostamp'];

let app;
let jobcan;
let timeout;

async function init() {

  app = new Vue({
    el: '#app',
    data: {
      config: {},
      configLocal: {},
      managers: [],
      message: '',
      // autostampCodes: autostampCodes
    },
    computed: {
      loginCode: {
        get() { return this.config.loginCode; },
        set(v) {
          this.config.loginCode = v;
          delayedOnce(loadManagers, 1000);
        }
      }
    },
    methods: {
      save: saveConfig(),
      setLocation(latitude, longitude) {
        app.config.latitude = latitude;
        app.config.longitude = longitude;
      },
      // getAutostampCode() {
      //   return autostampCodes[this.config.autostampMode].trim();
      // },
      clearLocals() {
        config.clearLocal();
        alert('削除しました');
      }
    }
  });

  await loadConfig();
  await loadManagers();
}

function delayedOnce(fn, ms) {
  clearTimeout(timeout);
  timeout = setTimeout(fn, ms);
}

async function loadManagers() {
  jobcan = Jobcan(app.loginCode);
  app.managers = await jobcan.listManagers(true);
}

async function loadConfig() {
  for (let key of configKeys) {
    Vue.set(app.config, key, await config().get(key));
  }
  for (let key of configLocalKeys) {
    Vue.set(app.configLocal, key, await config().getLocal(key));
  }
}

async function saveConfig() {
  if (!app.config.autostampMode || app.config.autostampMode == 'none') {
    app.configLocal.execAutostamp = false;
  }

  app.message = '保存しています...';

  for (let key of configKeys) {
    await config.set(key, app.config[key]);
  }

  for (let key of configLocalKeys) {
    await config.setLocal(key, app.configLocal[key]);
  }

  app.message = '保存しました'
  setTimeout(() => { app.message = '' }, 1000);
}

init();