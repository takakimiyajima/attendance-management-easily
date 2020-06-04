let app;
let jobcan;

const today = moment().add(-5, 'hour');

const initDay = (_date) => {
  const date = moment(_date);
  return {
    date: date,
    isToday: date.isSame(today, 'day'),
    jobcanDay: jobcan.day(date),
    holiday: holiday.check(date),
  };
};

const addDay = (diff) => {
  app.day = diff == 'today'
    ? initDay(today)
    : initDay(app.day.date.add(diff, 'day'));

  app.ui.input.time = app.day.isToday ? 'now' : '10';
  getInfo();
};

const getInfo = async () => {
  console.log('app.getInfo');
  Vue.set(app.day, 'info', await app.day.jobcanDay.getInfo(true));
};

const getBackgroundPage = () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.getBackgroundPage(resolve);
  });
};

/** 
 * 出社、退社ボタンが押された時に実行
 * @param isAuto true: 出社 false: 退社
 */
const stamp = async (isAuto) => {
  console.log('app.stamp', isAuto);

  if (confirmStamp(isAuto)) {
    Vue.set(app.day, 'result', null);
    let result;
    // 「いま」を選択したとき
    if (app.ui.input.time == 'now') {
      let latitude = await config().get('latitude');
      let longitude = await config().get('longitude');
      if (!latitude || !longitude) {
        const bg = await getBackgroundPage();
        latitude = bg.position.coords.latitude
        longitude = bg.position.coords.longitude;
      }

      const note = isAuto ? '出社' : '退社';
      const manager = await config().get('manager');

      result = await jobcan.stamp(isAuto, latitude, longitude, note, manager, true);
    }
    // セレクトボックスで時間を選択したとき
    else {
      const hour = app.ui.input.time;
      const note = isAuto ? '出社' : '退社';
      const manager = await config().get('manager');
      result = await app.day.jobcanDay.addStamp(isAuto, hour, 0, note, manager, true);
    }

    await getInfo();
    Vue.set(app.day, 'result', result);
  }
};

/**
 * 既に打刻がある場合に確認メッセージを出力
 * @param isAuto true: 出社 false: 退社
*/
const confirmStamp = (isAuto) => {
  let msg = null;
  if (isAuto && getStampsOf('Enter').length) msg = '既に出勤打刻がありますがよろしいですか？';
  if (!isAuto && getStampsOf('Leave').length) msg = '既に退勤打刻がありますがよろしいですか？';

  return msg ? confirm(msg) : true;
};

/**
 * @param typeId string 打刻の種類を表す文字列
 * @return 打刻の種類 Array<string>
 */
const getStampsOf = (typeId) => {
  console.log('app.getStampsOf', typeId);

  if ('info' in app.day) {
    return app.day.info.stamps.filter(s => s.typeId == typeId);
  }
  
  return [];
};

const getAlert = async () => {
  let msg = null;
  if (!(await config().get('loginCode'))) msg = "拡張機能のオプションでログインコードを設定してください！";
  else if (!(await config().get('manager'))) msg = "拡張機能のオプションで打刻グループを設定してください！";

  return msg;
}

async function init() {

  jobcan = Jobcan(await config().get('loginCode'));
  await holiday.init();

  app = new Vue({
    el: '#app',
    data: {
      alert: await getAlert(),
      day: initDay(today),
      ui: {
        input: {
          time: 'now'
        }
      }
    },
    methods: {
      addDay,
      stamp,
      getStampsOf
    }
  });

  await getInfo();
}

init();