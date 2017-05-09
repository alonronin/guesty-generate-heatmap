const Promise = require('bluebird');
const api = require('./api');
const db = require('./db');

const getListings = async (location, _offset = 0) => {
  try {
    const { items, pagination } = await api.search(location, _offset);
    const { next_offset, result_count } = pagination;

    items.forEach(async item => {
      let o = await db.get('listings').find({ id: item.id }).value();

      if (!o) {
        await db.get('listings').push(item).write().id
      }
    });

    console.log({ location, next_offset, result_count });

    if (result_count) return await Promise.delay(1000, getListings(location, next_offset, result_count));

  } catch (e) {
    console.error(e);
    return;
  }

  return { location, _offset };
};

const getListingsInfo = async () => {
  const items = db.get('listings')
  .filter(item => item.score && item.score > 0)
  .sortBy('score')
  .reverse()
  .take(4000)
  .value();

  return await Promise.map(items, item => {
    return api.info(item.id)
    .then(item => db.get('listings').find({ id: item.id }).assign(item).write())
    .then(item => {
      console.log(item);
      return item;
    })
  }, { concurrency: 2 });
};

const calculateScore = async () => {
  const score = ({
                   picture_count = 0,
                   reviews_count = 0,
                   star_rating = 0,
                   calendar_updated_at = 0,
                 }) => {
    return picture_count + reviews_count + star_rating - calendar_updated_at;
  };

  return await db
  .get('listings')
  .map(item => {
    const o = Object.assign({}, item);
    if (o.calendar_updated_at) o.calendar_updated_at = Math.round(
        Math.max(
            new Date() - new Date(item.calendar_updated_at), 0
        ) / 864e05
    );

    item.score = score(o);
    return item;
  })
  .write();
};

const createHeatMapFile = (items) => {
  if (!items.length) throw new Error('Cannot create heatmap, no Itmes passed!');

  const apiKey = 'AIzaSyD7xUy9v2G7ky7N9H7BFzVxy9mz2qHn7e4';
  const coordinates = items.map(({ lat, lng }) => `new google.maps.LatLng(${lat}, ${lng})`).join(',\n');
  const { lat, lng } = items[0];

  return `<!DOCTYPE html>\n    <html>\n      <head>\n        <meta charset="utf-8">\n        <title>Heatmaps</title>\n        <style>\n          /* Always set the map height explicitly to define the size of the div\n           * element that contains the map. */\n          #map {\n            height: 100%;\n          }\n          /* Optional: Makes the sample page fill the window. */\n          html, body {\n            height: 100%;\n            margin: 0;\n            padding: 0;\n          }\n          #floating-panel {\n            position: absolute;\n            top: 10px;\n            left: 25%;\n            z-index: 5;\n            background-color: #fff;\n            padding: 5px;\n            border: 1px solid #999;\n            text-align: center;\n            font-family: 'Roboto','sans-serif';\n            line-height: 30px;\n            padding-left: 10px;\n          }\n          #floating-panel {\n            background-color: #fff;\n            border: 1px solid #999;\n            left: 25%;\n            padding: 5px;\n            position: absolute;\n            top: 10px;\n            z-index: 5;\n          }\n        </style>\n      </head>\n    \n      <body>\n        <div id="floating-panel">\n          <button onclick="toggleHeatmap()">Toggle Heatmap</button>\n          <button onclick="changeGradient()">Change gradient</button>\n          <button onclick="changeRadius()">Change radius</button>\n          <button onclick="changeOpacity()">Change opacity</button>\n        </div>\n        <div id="map"></div>\n        <script>\n    \n          // This example requires the Visualization library. Include the libraries=visualization\n          // parameter when you first load the API. For example:\n          // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=visualization">\n    \n          var map, heatmap;\n    \n          function initMap() {\n            map = new google.maps.Map(document.getElementById('map'), {\n              zoom: 15,\n              center: {lat:${lat}, lng: ${lng}},\n              mapTypeId: 'satellite'\n            });\n    \n            heatmap = new google.maps.visualization.HeatmapLayer({\n              data: getPoints(),\n              map: map\n            });\n          }\n    \n          function toggleHeatmap() {\n            heatmap.setMap(heatmap.getMap() ? null : map);\n          }\n    \n          function changeGradient() {\n            var gradient = [\n              'rgba(0, 255, 255, 0)',\n              'rgba(0, 255, 255, 1)',\n              'rgba(0, 191, 255, 1)',\n              'rgba(0, 127, 255, 1)',\n              'rgba(0, 63, 255, 1)',\n              'rgba(0, 0, 255, 1)',\n              'rgba(0, 0, 223, 1)',\n              'rgba(0, 0, 191, 1)',\n              'rgba(0, 0, 159, 1)',\n              'rgba(0, 0, 127, 1)',\n              'rgba(63, 0, 91, 1)',\n              'rgba(127, 0, 63, 1)',\n              'rgba(191, 0, 31, 1)',\n              'rgba(255, 0, 0, 1)'\n            ]\n            heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);\n          }\n    \n          function changeRadius() {\n            heatmap.set('radius', heatmap.get('radius') ? null : 20);\n          }\n    \n          function changeOpacity() {\n            heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);\n          }\n    \n          // Heatmap data: 500 Points\n          function getPoints() {\n            return [\n              ${coordinates}\n            ];\n          }\n        </script>\n        <script async defer\n            src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&callback=initMap">\n        </script>\n      </body>\n    </html>`;
};

module.exports = { getListings, getListingsInfo, calculateScore, createHeatMapFile };