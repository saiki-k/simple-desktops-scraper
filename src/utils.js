const { BASE_URL } = require('./constants.js');
const getPageN = n => `${BASE_URL}/browse/${n}/`;

module.exports = { getPageN };