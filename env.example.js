const path = require('path');

process.env = {
	DOWNLOADS_FOLDER: path.join('.', 'data/simple_desktops'),
	CHECK_FOR_UPDATES: false,
};
