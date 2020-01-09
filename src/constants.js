const path = require('path');

const BASE_URL = "http://simpledesktops.com";
const TOTAL_COLLECTION_PAGES = 51;

const DATA_FOLDER = path.join('data');
const DOWNLOADS_FOLDER = path.join(DATA_FOLDER, 'simple_desktops');
const META_PATH = path.join(DATA_FOLDER, 'meta.json');

module.exports = {
	BASE_URL,
	TOTAL_COLLECTION_PAGES,
	DATA_FOLDER,
	DOWNLOADS_FOLDER,
	META_PATH
};