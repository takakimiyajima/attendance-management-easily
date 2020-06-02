const holiday = (() => {

  let data;

  const init = async () => {
    const url = 'https://holidays-jp.github.io/api/v1/date.json';
    data = await $.ajax({ url });
  };

  const check = (date) => {
    const key = date.format('YYYY-MM-DD');
    const isWeekend = [0, 6].includes(date.weekday());
    const isHoliday = key in data;
    const holidayName = isHoliday ? data[key] : null;
    const isWorkday = !isWeekend && !isHoliday;

    return { 
      isWeekend,
      isHoliday,
      holidayName,
      isWorkday
    };
  };
  
  return { init, check };

})();
