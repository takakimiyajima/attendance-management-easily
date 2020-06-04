const API = (() => {

  let jobcan = null;
  const stampedCache = { enter: {}, leave:{} };

  (async () => {
    await holiday.init();
    jobcan = Jobcan(await config().get('loginUrl'));
  })().catch(console.error);

  return {
    // 外部ライブラリ
    lib: {
      moment, // Moment.js https://momentjs.com/
    },

    // 永続的に保持したい変数（拡張機能のlocal storageに保存されます）
    // 引数:
    //   key: キー文字列
    //   val: 値（基本型, オブジェクト, 配列）
    saveValue: async (key, val) => {
      key = '_autostamp_' + key;
      return await config().setLocal(key, val);
    },
    loadValue: async (key) => {
      key = '_autostamp_' + key;
      return await config().getLocal(key);
    },


    // 打刻済みかどうか
    // 引数:
    //   date: YYYY/MM/DD文字列 または Dateオブジェクト または momentjsオブジェクト
    //   stampType: 'enter' または 'leave' 
    // => true/false
    isStamped: async (date, stampType) => {
      date = moment(new Date(date)).format('YYYY/MM/DD');
      const cached = stampedCache[stampType][date];

      if (cached) return true;

      const d = jobcan.day(date);
      const info = await d.getInfo(true);
      const result = info.stamps.filter(s => s.typeId.toLowerCase() == stampType).length > 0;
      if (result) stampedCache[stampType][date] = true;

      return result;
    },

    // 打刻を行う
    // 引数:
    //   date: YYYY/MM/DD文字列 または Dateオブジェクト または momentjsオブジェクト
    //   stampType: 'enter' または 'leave'
    //   hour, minute: 時, 分(int)
    //   notification: 'sticky'(確認するまで消えない通知), 'autoclose'(自動的に消える), false(通知しない)
    stamp: async (date, stampType, hour, minute, notification='autoclose') => {
      date = moment(new Date(date)).format('YYYY/MM/DD');
      console.log('API.stamp', date, stampType, hour, minute, notification);
      const manager = await config().get('manager');
      if (!manager) {
        throw new Error('Manager is not set. Please set it in the options page.');
      }
      if (await API.isStamped(date, stampType)) {
        throw new Error('Stamp "'+ stampType +'" already exists on ' + date);
      }
      const d = jobcan.day(date);
      const res = await d.addStamp(stampType=='enter', hour, minute, 'AutoStamp', manager, false);
      if(notification){
        API.notify(res, util.hhmm(hour, minute, true) + ' '+stampType.toUpperCase()+' - '+date.format('M/DD(ddd)'), notification=='sticky');
      }
    },

    // 祝日でないウィークデーかどうか
    // 引数 date: YYYY/MM/DD文字列 または Dateオブジェクト または momentjsオブジェクト
    // => true/false
    isWorkday: async (date) => {
      return await holiday.check(date).isWorkday;
    },

    // 通知を表示する
    // 引数:
    //   msg: メッセージ
    //   title: タイトル
    //   isSticky: クリックするまで消えなくするかどうか(true/false)
    notify: (msg, title, isSticky=true)=>{
      chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: '/public/img/icon128.png',
        title: title,
        message: msg.toString(),
        requireInteraction: isSticky
      });
    },
    

    // 現在位置を取得
    // => {latitude: 35.69xxx, longitude: 139.76xxx}
    getLocation: ()=>{
      return new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(pos => {
          res({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
          });
        });
      });
    },

    // 緯度経度の差を計算 (https://goo.gl/TKWdws)
    // => (km)
    calcDistance: (locA, locB) => {
      const deg2rad = deg => deg * (Math.PI/180);
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(locA.latitude-locB.latitude);
      const dLon = deg2rad(locA.longitude-locB.longitude); 
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(locA.latitude)) * Math.cos(deg2rad(locB.latitude)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c; // Distance in km
      return d;
    },

    // チームラボ小川町オフィスからの距離を計算
    // => (km)
    getDistanceFromOffice: async ()=>{
      const locCurrent = await API.getLocation();
      const locOgawamachi = { latitude: 35.6951338, longitude: 139.7645701 };
      return API.calcDistance(locCurrent, locOgawamachi);
    },

    // PCが一定期間（seconds秒）以上アイドル状態かどうかを調べる
    // => true/false
    isComputerIdle: (seconds)=>{
      if (seconds<15) throw new Error('argument "second" must be >= 15.');
      return new Promise((res, rej) => {
        chrome.idle.queryState(seconds, state => {
          res(['idle', 'locked'].includes(state));
        });
      });
    },

    // PCが現在アクティブかどうかを調べる
    // => true/false
    isComputerActive: async (seconds=60) => {
      return !(await API.isComputerIdle(seconds));
    }
  };    
})();