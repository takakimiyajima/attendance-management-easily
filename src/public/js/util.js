const util = {};

util.ymd = (date) => {
  return date.format('YYYYMMDD');
};

// hour, minute -> hhmm
util.hhmm = (hour, minute, colon=false) => {
  hour = parseInt(hour) + parseInt(parseInt(minute) / 60);
  minute = parseInt(minute) % 60;
  colon = colon ? ':' : '';

  return ('00' + hour).slice(-2) + colon + ('00' + minute).slice(-2);
};

// hh:mm -> hour, minute
util.parseTime = (time) => {
  if (/^\d{1,2}:\d{2}$/.exec(time)) {
    const date = moment('1970/01/01 '+time);

    return {hour: date.hour(), minute: date.minute()};
  }
  
  return null;
};

util.listDaysInMonth = (date) => {
  const out = [];
  for (var d=moment(date).date(1); d.month()==date.month(); d=d.add(1, 'day')) {
    out.push(moment(d));
  }

  return out;
};

util.removeSpace = (str) => {
  return str.replace(/[\t\s\n]/g,'');
};

util.trim = (str) => {
  return str.replace(/^[\t\s\n]*|[\t\s\n]*$/g,'');
}

