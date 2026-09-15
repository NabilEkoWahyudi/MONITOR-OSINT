const cams = {
  tokyo: '@ANNnewsCH',
  singapore: '@SingaporeSkyline',
  earth: '@nasa',
  iss: '@SpaceVideos',
  london: '@EarthCam',
  paris: '@EarthCam',
  dubai: '@EarthCam',
  nyc: '@EarthCam'
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
  for (const [name, handle] of Object.entries(cams)) {
    const id = await getLiveId(handle);
    console.log(name + ': ' + id);
  }
})();
