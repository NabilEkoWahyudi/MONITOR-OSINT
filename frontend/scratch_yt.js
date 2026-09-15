const channels = {
  aljazeera: '@aljazeeraenglish',
  dw: '@dwnews',
  france24: '@France24_en',
  sky: '@SkyNews',
  trt: '@trtworld',
  euronews: '@euronews',
  wion: '@WION',
  bloomberg: '@BloombergTelevision',
  cnn: '@CNN'
};

async function getLiveId(handle) {
  try {
    const res = await fetch('https://www.youtube.com/' + handle + '/live');
    const text = await res.text();
    const match = text.match(/"videoId":"([^"]+)"/);
    return match ? match[1] : 'NOT FOUND';
  } catch(e) { return 'ERROR'; }
}

(async () => {
  for (const [name, handle] of Object.entries(channels)) {
    const id = await getLiveId(handle);
    console.log(name + ': ' + id);
  }
})();
