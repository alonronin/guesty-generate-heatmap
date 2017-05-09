Guesty Assignment
===

> it will run against a City and will create a `heatmap.html` file in the end.

##instructions

`git clone` then `npm install` and `npm start`;

you can run with different city: `node . "Los Angeles``;

you can uncomment line #28 at `index.js` to limit to only 2 neighborhoods.

`throttling` is hard coded, you can search `Promise.delay(1000)` and change there the ms.

##what is missing?

you need to delete the `db.json` file for a different City.
you cannot specify a country, only a city.

filtering by neighborhoods sometimes returned more then 1,000 records so I need to filter, maybe, by price ranges.





