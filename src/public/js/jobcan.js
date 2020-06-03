const Jobcan = (loginCode) => {

  const loginParam = '&code=' + loginCode;

  const day = (_date) => {

    const date = moment(new Date(_date));

    const parseInfo = (html) => {
      const out = {
        date: date,
        hours: {
          accepted: null,
          applied: null
        },
        alert: '',
        stamps: []
      };
      const clean = util.removeSpace(html);
      const doc = $(html);

      //勤務時間
      const reHours = /<b>総計<\/b>(\d+:\d+)\&nbsp\;<b>休憩<\/b>(\d+:\d+)<br>/g;
      const getHours = (match) => {
        const work = moment.duration(match[1]);
        const rest = moment.duration(match[2]);
        const total = work + rest;

        return { work, rest, total };
      };
      var match = reHours.exec(clean);
      if (match) {
        out.hours.accepted = getHours(match);
        match = reHours.exec(clean);
        if (match) {
          out.hours.applied = getHours(match);
        }
      }

      //アラート
      const alert = doc.find('font[style="color:red; font-size: 13px"]').text();
      out.alert = util.removeSpace(alert);

      //打刻一覧
      doc.find('table.shift03t tr').each(() => {
        if ($(this).find('td:nth-child(1) a').text().length > 0) {
          const type = util.trim($(this).find('td:nth-child(1) a').text());
          let typeId = '';
          if(['出勤', '入室'].includes(type)) typeId = 'Enter';
          if(['退勤', '退室'].includes(type)) typeId = 'Leave';
          out.stamps.push({
            type, typeId,
            time: util.trim($(this).find('td:nth-child(2)').text()),
            manager: util.trim($(this).find('td:nth-child(3)').text()),
            status: util.trim($(this).find('td:nth-child(4)').text()),
          });
        }
      });

      return out;
    };

      //勤怠情報取得
    const getInfo = async (doLogin) => {
      console.log('jobcan.getInfo', util.ymd(date));
      var url = 'https://ssl.jobcan.jp/m/work/accessrecord?recordDay=' + util.ymd(date);
      if(doLogin) url += loginParam;
      const html = await $.ajax({url});

      return parseInfo(html);
    };

    //打刻申請
    const addStamp = async (isAuto, hour, minute, note, manager, doLogin) => {
      console.log('jobcan.addStamp', util.ymd(date), isAuto, hour, minute, note, manager);
      var url = 'https://ssl.jobcan.jp/m/work/accessrecord?_m=edit&recordDay=' + util.ymd(date);
      if (doLogin) url += loginParam;
      var html = await $.ajax({ url });
      var doc = $(html);
      const form = doc.find('form');
      if (form.length) {
        const data = {
          token: form.find('input[name=token]').val(),
          year: date.format('YYYY'),
          month: date.format('M'),
          day: date.format('D'),
          adit_item1: isAuto ? '' : 'work_end',
          time1: util.hhmm(hour, minute),
          reason1: note,
          group_id: manager,
          adit_item2: '',
          time2: '',
          reason2: ''
        };
        let url = 'https://ssl.jobcan.jp/m/work/stamp';
        html = await $.ajax({url, data, method: 'POST'});
        doc = $(html);
        const alert = doc.find('font[size="2"][color="red"]').text();

        return util.removeSpace(alert);
      }

      const domAlert = doc.find('div[align="center"]');
      if (domAlert.length) {
        return util.removeSpace(domAlert.text());
      }
      
      return '不明のエラー';
    }

    const url = 'https://ssl.jobcan.jp/m/work/accessrecord?recordDay=' + util.ymd(date);

    return {
      date,
      addStamp,
      getInfo,
      url
    };
  };

  //通常の打刻
  const stamp = async (isAuto, latitude, longitude, note, manager, doLogin) => {
    console.log('jobcan.stamp', isAuto, latitude, longitude, note, manager);
    const date = moment();
    const data = {
      year: date.format('YYYY'),
      month: date.format('M'),
      day: date.format('D'),
      lat: latitude,
      lon: longitude,
      time: date.format('HHmm'),
      reason: note,
      group_id: manager,
      position_id: '',
      adit_item: isAuto ? '打刻' : '退勤',
      yakin: ''
    };
    let url = 'https://ssl.jobcan.jp/m/work/stamp-save-confirm/';
    if (doLogin) url += loginParam;
    let html = await $.ajax({ url, data, method:'POST' });
    var doc = $(html);
    var domToken = doc.find('input[name=token]');
    if (domToken.length) {
      data.token = domToken.val();
      data.confirm = 'はい';
      url = 'https://ssl.jobcan.jp/m/work/stamp-save-smartphone/';
      html = await $.ajax({ url, data, method:'POST' });
      doc = $(html);        
    }
    var domAlert = doc.find('div[style="text-align: center"]');
    if (domAlert.length) {
      return util.removeSpace(domAlert.text());
    }

    return '不明なエラー';
  };

  const listManagers = async (doLogin) => {
    console.log('jobcan.listManagers');
    const out = [];
    let url = 'https://ssl.jobcan.jp/m/work/accessrecord?_m=adit';
    if (doLogin) url += loginParam;
    const html = await $.ajax({ url });
    const doc = $(html);
    doc.find('select[name=group_id] option').each(() => {
      out.push({
        id: $(this).val(),
        name: $(this).text()
      });
    });

    return out;
  };

  const login = async () => {
      console.log('jobcan.login');
      let url = 'https://ssl.jobcan.jp/m?code=' + loginCode;
      await $.ajax({url});
  };

  return {
      day,
      stamp,
      listManagers,
      login
  };
};


async function test() {

  const jobcan = Jobcan(await config.get('dakokuUrl'));

  //ログイン
  await jobcan.login();

  //管理者一覧取得
  console.log(await jobcan.listManagers());

  //過去日の情報取得と打刻申請
  const day = jobcan.day(moment('2019/06/02'));
  console.log(await day.getInfo());
  console.log(await day.addStamp(true, moment().hour(), moment().minute(), 'テスト', await config.get('manager')));

  //GPS打刻
  console.log(await jobcan.stamp(true, 35.7041823, 139.7565229, '出勤', 86));
}

//test();