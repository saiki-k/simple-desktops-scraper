const axios = require('axios');
const cheerio = require('cheerio');

const fs = require('fs');
const path = require('path');

const download = require("image-downloader");
const sanitize = require("sanitize-filename");

const { getPageN } = require('./utils.js');
const { BASE_URL, MAX_COLLECTION_PAGES } = require('./constants.js');

// TODO: Move the following to constants.js, and utils.js; resp...
const DATA_FOLDER = path.join('..', 'data');
const DOWNLOADS_FOLDER = path.join(DATA_FOLDER, 'simple_desktops');
const META_PATH = path.join(DATA_FOLDER, 'meta.json');
const getWallPath = (fileName) => `../data/simple_desktops/${sanitize(fileName)}.png`

const scrapeCollectionPage = async (pageNo) => {
	const pageURL = getPageN(pageNo);
	const response = await axios(pageURL);
	const html = response.data;

	const $ = cheerio.load(html);

	const walls = [];
	let wallObj = {};

	$("div.desktop").contents().each((idx, ele) => {
		const html = $(ele).html();
		if (html) {
			if (ele.name === 'a') {
				wallObj = {}; // Start of a new wall data
				const wallPageURL = `${BASE_URL}${$(ele).attr('href')}`;
				const urlParts = wallPageURL.split('/');
				const timeStamp = `${urlParts[5]}-${urlParts[6]}-${urlParts[7]}`;
				const thumbURL = $(ele).find('img').attr('src');
				const wallTitle = $(ele).find('img').attr('title');

				wallObj = Object.assign({}, wallObj, {
					wallPageURL,
					timeStamp,
					thumbURL,
					probWallURL: `${thumbURL.split('.png')[0]}.png`,
					wallTitle,
					wallFileName: `${timeStamp} - ${sanitize(wallTitle)}`,
					wallAltTitle: $(ele).find('img').attr('alt'),
				});
			}
			if (ele.name === 'span') {
				wallObj = Object.assign({}, wallObj, {
					author: $(ele).find('a').text(),
					authorURL: $(ele).find('a').attr('href'),
				});
				walls.push(wallObj); // End of a wall data
			}
		}
	});

	return walls;
};

const scrapeCollectionPagesAndDownloadMeta = async (noOfPages, startPage = 1, concat = true) => {
	const oldWallsMeta = concat && fs.existsSync(META_PATH)
		? JSON.parse(fs.readFileSync(META_PATH) || [])
		: [];
	
	const pagePromises = [];
	for (let i = startPage; i < startPage + noOfPages; i++) {
		pagePromises.push(scrapeCollectionPage(i));
	}
	const wallsArr = await Promise.all(pagePromises);

	const newWallsMeta = wallsArr.reduce((acc, curr) => acc.concat(curr), []);
	const wallsMeta = oldWallsMeta.concat(newWallsMeta);

	fs.writeFileSync(META_PATH, JSON.stringify(wallsMeta));
};

const downloadWalls = async (noOfWalls, startWall = 1, downloadMeta = false) => {
	if (downloadMeta) {
		// TODO: Replace the magic number with a constant
		await scrapeCollectionPagesAndDownloadMeta(51);
	}
	
	const wallsData = JSON.parse(fs.readFileSync(META_PATH));
	console.log("Total downloads to be done:", wallsData.length);
	
	const zeroIdx = startWall - 1;
	for (let i = zeroIdx; i < zeroIdx + noOfWalls; i++) {
		const wall = wallsData[i];
		const dest = getWallPath(wall.wallFileName);
		const options = {
			url: wall.probWallURL,
			dest
		};

		fs.access(dest, fs.F_OK, (err) => {
			if (!err) { // File exists
				return;
			}
			download
				.image(options)
				.then(({ filename, image }) => {
					console.log(i, "Saved to", filename);
				})
				.catch(err => console.error(err));
		});
	}
}

if (!fs.existsSync(DATA_FOLDER)){
	fs.mkdirSync(DATA_FOLDER);
	if (!fs.existsSync(DOWNLOADS_FOLDER)) {
		fs.mkdirSync(DOWNLOADS_FOLDER);
	}
}

// TODO: Replace the magic number with a constant
downloadWalls(1413, 1, true);