const path = require('path');

const { BASE_URL } = require('./constants.js');
const { SIMPLE_DESKTOPS_DOWNLOADS_FOLDER } = process.env;

const getNthPageURL = (n) => `${BASE_URL}/browse/${n}/`;

const getWallFilename = (wall, options = { includeDateInFilename: true }) => {
	let wallFilename = wall.sanitizedWallTitle || wall.wallOriginalFilename;
	wallFilename = options.includeDateInFilename ? `${wall.wallUploadDate} · ${wallFilename}`: wallFilename;

	return `${wallFilename}${wall.wallExt?.toLowerCase() || '.png'}`;
}

const getWallPath = (wall) =>
	path.join(SIMPLE_DESKTOPS_DOWNLOADS_FOLDER, getWallFilename(wall));

const getWallFilenamesFromMeta = (walls) => walls.map((wall) => getWallFilename(wall));

const getDateObjFromUploadDateStr = (uploadDateStr) => {
	const [year, month, day] = uploadDateStr.split('-');
	return new Date(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
};

const sortWallsByUploadDate = (wallA, wallB) =>
	getDateObjFromUploadDateStr(wallB.wallUploadDate) - getDateObjFromUploadDateStr(wallA.wallUploadDate);

module.exports = {
	getNthPageURL,
	getWallFilename,
	getWallPath,
	getWallFilenamesFromMeta,
	sortWallsByUploadDate,
};
