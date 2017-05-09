const low = require('lowdb');
const fileAsync = require('lowdb/lib/storages/file-async');

const db = low('db.json', {
  storage: fileAsync
});

module.exports = db;