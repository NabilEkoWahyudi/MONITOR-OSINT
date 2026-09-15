const fetch = require('node-fetch');
const satellite = require('satellite.js');

async function testSat() {
  try {
    console.log('Testing satellite.js with ISS TLE from CelesTrak...');
    const r = await fetch('https://celestrak.org/SOCRATES/query.php?CATNR=25544&DAYS=1&MAX=50&CONSTRAINTS=0&FORMAT=json', { timeout: 8000 });
    console.log('SOCRATES status:', r.status);
  } catch(e) {
    console.log('SOCRATES failed:', e.message);
  }

  // Test CelesTrak TLE API
  try {
    console.log('\nTesting CelesTrak TLE API...');
    const ids = [25544, 20580, 43013, 27424, 25994, 37849];
    const url = `https://celestrak.org/SOCRATES/query.php?CATNR=${ids[0]}&FORMAT=json`;
    
    // Actually try the GP endpoint
    const gpUrl = 'https://celestrak.org/SOCRATES/query.php?CATNR=25544&FORMAT=json';
    
    // Use TLE endpoint instead
    const tleUrl = `https://celestrak.org/satcat/satcat-formatted.csv?CATNR=25544`;
    const r2 = await fetch(tleUrl, { timeout: 8000 });
    console.log('TLE CSV status:', r2.status);
    const txt = await r2.text();
    console.log('Preview:', txt.substring(0, 200));
  } catch(e) {
    console.log('CelesTrak failed:', e.message);
  }

  // Test ivanstanojevic TLE
  try {
    console.log('\nTesting ivanstanojevic TLE...');
    const r3 = await fetch('https://tle.ivanstanojevic.me/api/tle/25544', { timeout: 8000 });
    const d3 = await r3.json();
    console.log('TLE keys:', Object.keys(d3));
    console.log('Line1 preview:', d3.line1?.substring(0, 40));
    console.log('Line2 preview:', d3.line2?.substring(0, 40));
    
    // Compute position with satellite.js
    const satrec = satellite.twoline2satrec(d3.line1, d3.line2);
    const now = new Date();
    const pv = satellite.propagate(satrec, now);
    const gmst = satellite.gstime(now);
    const geo = satellite.eciToGeodetic(pv.position, gmst);
    console.log('ISS position:', {
      lat: satellite.degreesLat(geo.latitude).toFixed(4),
      lng: satellite.degreesLong(geo.longitude).toFixed(4),
      alt: (geo.height * 6371).toFixed(1) + ' km',
    });
  } catch(e) {
    console.log('TLE compute failed:', e.message);
  }
}

testSat();
