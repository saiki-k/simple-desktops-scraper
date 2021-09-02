const path = require('path');

const { BASE_URL } = require('./constants.js');
const { SIMPLE_DESKTOPS_DOWNLOADS_FOLDER } = process.env;

const getNthPageURL = (n) => `${BASE_URL}/browse/${n}/`;

const getWallFilename = (wallFilename, wallExt) => `${wallFilename}${wallExt?.toLowerCase() || '.png'}`;

const getWallPath = (wallFilename, wallExt) =>
	path.join(SIMPLE_DESKTOPS_DOWNLOADS_FOLDER, getWallFilename(wallFilename, wallExt));

const getWallFilenamesFromMeta = (walls) => walls.map((wall) => getWallFilename(wall.wallFilename, wall.wallExt));

const getDateObjFromTimestamp = (timestamp) => {
	const [year, month, day] = timestamp.split('-');
	return new Date(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
};

const sortWallsByTimestamp = (wallA, wallB) =>
	getDateObjFromTimestamp(wallB.timestamp) - getDateObjFromTimestamp(wallA.timestamp);

const reflectPromise = (p) =>
	p.then(
		(val) => ({ val, status: 'fulfilled' }),
		(err) => ({ err, status: 'rejected' })
	);

module.exports = {
	getNthPageURL,
	getWallFilename,
	getWallPath,
	getWallFilenamesFromMeta,
	getDateObjFromTimestamp,
	sortWallsByTimestamp,
	reflectPromise,
};
