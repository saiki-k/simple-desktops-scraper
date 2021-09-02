const path = require('path');

const BASE_URL = 'http://simpledesktops.com';

const DATA_FOLDER = path.join('data');
const META_PATH = path.join(DATA_FOLDER, 'meta.json');

const MAX_COLLECTION_PAGES = 60;

module.exports = {
	BASE_URL,
	MAX_COLLECTION_PAGES,
	DATA_FOLDER,
	META_PATH,
};
