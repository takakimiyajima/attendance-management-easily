const autostampCodes = {
  default: {
      title: 'デフォルトモード',
      description: '出勤:7-15時の中ではじめてオフィスでPC操作をしたタイミング ／ 退勤:17-27時の中でその時刻から5時間オフィスでのPC操作がないタイミング',
      code: `
const moment = API.lib.moment;

const isInOffice = await API.getDistanceFromOffice() < 0.5;
const isComputerActive = await API.isComputerActive();
const isWorkingAtOffice = isInOffice && isComputerActive;

const lastWorkingTime = moment(await API.loadValue('LastWorkingTime'));
const isWorkFinished = moment().diff(lastWorkingTime, 'hours') > 5;

if(isWorkFinished){

  // Leave
  const m = lastWorkingTime;
  const today = m.subtract(5, 'hours').format('YYYY/MM/DD');
  const hour = m.hour() < 5 ? m.hour()+24 : m.hour();
  const minute = m.minute();
  const isLeaveTimeRange = (17 <= hour && hour <= 24) || hour <= 3;
  if(isLeaveTimeRange){
      const isStampedLeave = await API.isStamped(today, 'leave');
      if(!isStampedLeave){
          await API.stamp(today, 'leave', hour, minute, 'sticky');
      }
  }
}

if(isWorkingAtOffice){

  // Update last working time
  await API.saveValue('LastWorkingTime', moment().format());

  // Enter
  const m = moment();
  const today = m.format('YYYY/MM/DD');
  const hour = m.hour();
  const minute = m.minute();
  const isEnterTimeRange = (7 <= hour && hour <= 15);
  if(isEnterTimeRange){
      const isStampedEnter = await API.isStamped(today, 'enter');
      if(!isStampedEnter){
          await API.stamp(today, 'enter', hour, minute, 'sticky');
      }
  }

}

      `
  }

};
