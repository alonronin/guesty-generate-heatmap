const throttle = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));
const total = arr => arr.reduce((acc, item) => acc += item, 0);
const slugify = str => str.trim().toLowerCase().replace(' ', '-');

module.exports = {
  throttle,
  total,
  slugify
};