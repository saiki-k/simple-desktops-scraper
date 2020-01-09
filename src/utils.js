const path = require('path');

const { BASE_URL, DOWNLOADS_FOLDER } = require('./constants.js');

const getNthPageURL = n => `${BASE_URL}/browse/${n}/`;
const getWallPath = (fileName) => path.join(DOWNLOADS_FOLDER, `${fileName}.png`)

module.exports = { getNthPageURL, getWallPath };