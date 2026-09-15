const sat = require('satellite.js');
const fetch = require('node-fetch');

async function run() {
  const d = await (await fetch('https://tle.ivanstanojevic.me/api/tle/25544')).json();
  const rec = sat.twoline2satrec(d.line1, d.line2);
  const now = new Date();
  const pv = sat.propagate(rec, now);
  const gmst = sat.gstime(now);
  const geo = sat.eciToGeodetic(pv.position, gmst);
  console.log(JSON.stringify({
    lat: sat.degreesLat(geo.latitude),
    lng: sat.degreesLong(geo.longitude),
    alt_km: geo.height,  // in km already? or earth radii?
    alt_er: geo.height * 6371, // earth radii * radius
  }, null, 2));
}
run().catch(console.error);
