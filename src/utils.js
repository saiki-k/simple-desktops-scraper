const path = require('path');

const { BASE_URL, DOWNLOADS_FOLDER } = require('./constants.js');

const getNthPageURL = n => `${BASE_URL}/browse/${n}/`;
const getWallPath = (fileName, wallExt) => path.join(
	DOWNLOADS_FOLDER,
	`${fileName}${wallExt ? wallExt.toLowerCase() : '.png'}`
);

const getDateObjFromTimestamp = timestamp => {
	const [year, month, day] = timestamp.split('-');
	return new Date(
		parseInt(year, 10), parseInt(month, 10), parseInt(day, 10)
	);
};
const sortWallsByTimestamp = (wallA, wallB) =>
	getDateObjFromTimestamp(wallB.timestamp) - getDateObjFromTimestamp(wallA.timestamp);

module.exports = {
	getNthPageURL,
	getWallPath,
	getDateObjFromTimestamp,
	sortWallsByTimestamp
};