const total = arr => arr.reduce((acc, item) => acc += item, 0);
const slugify = str => str.trim().toLowerCase().replace(' ', '-');

module.exports = {
  total,
  slugify
};