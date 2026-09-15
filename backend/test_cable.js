const fetch = require('node-fetch');

async function test() {
  try {
    console.log('Testing TeleGeography all.json...');
    const r = await fetch('https://www.submarinecablemap.com/api/v3/cable/all.json', { timeout: 12000 });
    console.log('Status:', r.status);
    const data = await r.json();
    console.log('Count:', Array.isArray(data) ? data.length : 'NOT ARRAY, keys:', Object.keys(data).slice(0,5));
    if (Array.isArray(data) && data.length > 0) {
      console.log('First cable:', JSON.stringify(data[0]));
    } else if (data && data.cables) {
      console.log('Has .cables, count:', data.cables.length);
      console.log('First:', JSON.stringify(data.cables[0]));
    } else {
      console.log('Raw:', JSON.stringify(data).substring(0, 500));
    }

    // Test one cable detail
    const slug = Array.isArray(data) ? data[0]?.slug : (data.cables?.[0]?.slug);
    if (slug) {
      console.log('\nTesting cable detail for slug:', slug);
      const r2 = await fetch(`https://www.submarinecablemap.com/api/v3/cable/${slug}.json`, { timeout: 12000 });
      const d2 = await r2.json();
      console.log('Detail keys:', Object.keys(d2));
      if (d2.cable) {
        console.log('Cable keys:', Object.keys(d2.cable));
        const features = d2.cable.features || [];
        console.log('Features count:', features.length);
        if (features[0]) {
          console.log('First feature geometry type:', features[0].geometry?.type);
          const coords = features[0].geometry?.coordinates;
          console.log('Coord count:', Array.isArray(coords) ? coords.length : 'N/A');
          if (coords && coords[0]) {
            console.log('First coord sample:', JSON.stringify(coords.slice(0,3)));
          }
        }
      } else {
        console.log('No .cable in response, keys:', Object.keys(d2).slice(0,10));
        console.log('Raw preview:', JSON.stringify(d2).substring(0, 400));
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
