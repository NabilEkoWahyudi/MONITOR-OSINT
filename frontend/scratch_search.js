const queries = {
  cam_kl: 'kuala lumpur twin towers live',
  cam_manila: 'manila skyline live',
  cam_newdelhi: 'new delhi street live',
  cam_gaza: 'gaza live stream',
  cam_telaviv: 'tel aviv beach live',
  tv_russia: 'russia 24 live',
  tv_korea: 'kbs world tv live',
  tv_philippines: 'abs cbn news live'
};

async function searchLive(query) {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+live&sp=EgJAAQ%253D%253D`);
    const text = await res.text();
    const match = text.match(/"videoId":"([^"]+)"/);
    return match ? match[1] : 'NOT FOUND';
  } catch (e) {
    return 'ERROR';
  }
}

(async () => {
  for (const [key, q] of Object.entries(queries)) {
    const id = await searchLive(q);
    console.log(`${key}: ${id}`);
    await new Promise(r => setTimeout(r, 2000));
  }
})();
