const getGps = () => {
  return new Promise((resolve, reject) => {
    // 一回限りの位置取得
    navigator.geolocation.getCurrentPosition(resolve);
  });
};

// 位置を取得
const setPosition = async () => {
  const latitude = await config.get('latitude');
  const longitude = await config.get('longitude');
  if (!latitude || !longitude) {
    window.position = await getGps();
  }
}

// 1分毎に位置を取得し直す
setInterval(setPosition, 60*1000);