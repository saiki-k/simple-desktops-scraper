const path = require('path');

const BASE_URL = 'http://simpledesktops.com';

const DATA_FOLDER = path.join(__dirname, '..', 'data');
const META_PATH = path.join(DATA_FOLDER, 'meta.json');

module.exports = {
	BASE_URL,
	DATA_FOLDER,
	META_PATH,
};
