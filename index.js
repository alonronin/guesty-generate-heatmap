const Promise = require('bluebird');
const fs = require('fs');
const db = require('./db');
const api = require('./api');
const utils = require('./utils');
const { getListings, getListingsInfo, calculateScore, createHeatMapFile } = require('./operations');

(async function(){
  await db.defaults({ listings: [] }).write();

  try {
    const location = process.argv.pop();

    const count = await api.listingCount(location);

    if(count < 4000) {
      console.error(`the location ${location} has too few listings`);
      return;
    }

    const neighborhoods = await api.neighborhoods(location);

    if (!neighborhoods.length) {
      console.error(`No neighborhoods found for ${location}`);
      return;
    }

    // neighborhoods.length = 2;

    await Promise.map(neighborhoods, item => {
      return Promise.delay(1000).then(
          () => getListings(`${location} ${item}`)
      );
    }, { concurrency: 2 });

    await calculateScore();
    await getListingsInfo();
    await calculateScore();

    const items = db.get('listings')
    .filter(item => item.score && item.score > 0)
    .sortBy('score')
    .reverse()
    .take(4000)
    .map(({ lat, lng, score }) => ({ lat, lng, score }))
    .value();

    fs.writeFileSync('heatmap.html', createHeatMapFile(items));

    console.log('=== DONE ===');

  } catch (e) {
    console.error(e);
  }
})();

