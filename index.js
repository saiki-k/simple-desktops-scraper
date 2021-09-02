const fs = require('fs');

if (!fs.existsSync('./env.js')) {
	fs.copyFileSync('./env.example.js', './env.js');
}

require('./env.js');

const { downloadWalls } = require('./src/scrapers.js');

downloadWalls({ checkForUpdates: false });
