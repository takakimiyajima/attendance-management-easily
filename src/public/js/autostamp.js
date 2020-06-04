(()=>{

  const createNextInterval = ()=>{
      const nextTime = moment().add(1, 'minute');
      nextTime.set({second: 0, millisecond: 0});
      chrome.alarms.create('AutoStamp', {
          when: nextTime.unix() * 1000
      });
  }
  const onInterval = ()=>{
      createNextInterval();
      const exec = async () => {
          const isExec = await config().getLocal('execAutostamp');
          const mode = await config().get('autostampMode');
          const customCode = await config().get('autostampCustomCode');

          if(isExec && mode && mode!='none'){
              const code = mode=='custom' ? customCode : autostampCodes[mode].code;
              if(!code) throw new Error('AutoStamp Code not found.');
              const fn = Function('API', 'return async ()=>{'+code+'};')(API);
              console.log('AutoStamp Start:', mode);
              await fn();
              console.log('AutoStamp End:', mode);
          }
      };
      exec().catch(e=>{
          console.error(e);
          API.notify(e.toString(), 'Error in AutoStamp');
      });
  }
  chrome.alarms.onAlarm.addListener(alarm => {
      if (alarm.name == 'AutoStamp') onInterval();
  });
  onInterval();

})();