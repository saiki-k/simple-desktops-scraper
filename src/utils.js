const path = require('path');

const { BASE_URL, DOWNLOADS_FOLDER } = require('./constants.js');

const getNthPageURL = n => `${BASE_URL}/browse/${n}/`;
const getWallPath = (fileName, wallExt) => path.join(
	DOWNLOADS_FOLDER,
	`${fileName}${wallExt ? wallExt.toLowerCase() : '.png'}`
);

module.exports = { getNthPageURL, getWallPath };