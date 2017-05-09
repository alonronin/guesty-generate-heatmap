const http = require('axios');
const { parseDate } = require('chrono-node');
const { slugify, total } = require('./utils');

const base_url = 'https://api.airbnb.com/v2';
const client_id = '3092nxybyb0otqw18e8nh5nty';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36'
};

const limit = 50;

const get = async (
    url,
    params
) => await http.get(`${base_url}${url}`, {
  params: Object.assign({}, { client_id }, params),
  headers
});

const search = async (location, _offset = 0, _limit = limit) => {
  let items = [];
  let pagination = {};

  try {
    const response = await get('/search_results', { location, _offset, _limit });

    items = response.data.search_results.map(
        ({
           listing: {
             id,
             picture_count,
             city,
             reviews_count,
             star_rating,
             lat,
             lng
           }
         }) => ({
          id,
          picture_count,
          city,
          reviews_count,
          star_rating,
          lat,
          lng
        }));

    pagination = response.data.metadata.pagination;
  } catch (e) {
  }

  return { items, pagination }
};

const reviews = async listing_id => {
  const role = 'all';
  let items = [];

  try {
    const response = await get('/reviews', { listing_id, role });

    items = response.data.reviews.map(
        ({
           id,
           listing_id,
           comments,
           created_at
         }) => ({
          id,
          listing_id,
          comments,
          created_at
        }));
  } catch (e) {
  }

  return { items }
};

const info = async id => {
  const _format = 'v1_legacy_for_p3';
  const url = `/listings/${id}`;

  let item = {};

  try {
    const response = await get(url, { _format });

    let { id, calendar_updated_at } = response.data.listing;
    if (calendar_updated_at) calendar_updated_at = parseDate(calendar_updated_at);

    item = { id, calendar_updated_at };

  } catch (e) {
    console.error(e);
  }

  return item
};

const neighborhoods = async city => {
  const location = slugify(city);
  const url = `https://www.airbnb.com/locations/${location}/neighborhood-traits.json`

  let data = [];

  try {
    const result = await http.get(url);
    data = result.data.city.neighborhoods.map(item => item.name);
  } catch (e) {
  }

  return data;
};

const listingCount = async location => {
  const _offset = 0;
  const _limit = 1;
  let ret = 0;

  try {
    const response = await get('/search_results', { location, _offset, _limit });
    ret = total(response.data.metadata.facets.room_type.map(item => item.count));
  } catch (e) {
  }

  return ret;
};

module.exports = {
  get,
  search,
  info,
  reviews,
  neighborhoods,
  listingCount
};