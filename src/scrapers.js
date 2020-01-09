const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const sanitize = require("sanitize-filename");
const download = require("image-downloader");

const {
	getNthPageURL,
	getWallPath,
	getDateObjFromTimestamp,
	sortWallsByTimestamp
} = require('./utils.js');
const {
	BASE_URL,
	TOTAL_COLLECTION_PAGES,
	DATA_FOLDER,
	DOWNLOADS_FOLDER,
	META_PATH
} = require('./constants.js');

const scrapeCollectionPage = async (pageNo) => {
	const pageURL = getNthPageURL(pageNo);
	let response = { data: '' };
	try {
		response = await axios(pageURL);
	} catch (e) {
		console.log(e);
		return;
	}
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
				const thumbURL = $(ele).find('img').attr('src');
				const wallTitle = $(ele).find('img').attr('title');
				
				const probWallURL = thumbURL.split('.295x184')[0];
				const wallURLParts = probWallURL.split('/');
				
				const timestamp = `${wallURLParts[5]}-${wallURLParts[6]}-${wallURLParts[7]}`;
				
				const wallOriginalFileName = wallURLParts[8];
				const wallOriginalFileNameParts = wallOriginalFileName.split('.')
				const isExtPresent = wallOriginalFileNameParts.length > 1;
				const wallExt = isExtPresent ? '.' + wallOriginalFileNameParts.pop() : '';
				

				wallObj = Object.assign({}, wallObj, {
					wallPageURL,
					timestamp,
					thumbURL,
					probWallURL,
					wallTitle,
					wallOriginalFileName,
					wallExt,
					wallFileName: `${timestamp} - ${sanitize(wallTitle)}`,
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

	return walls.sort(sortWallsByTimestamp);
};

const scrapeCollectionPagesAndDownloadMeta = async (noOfPages) => {
	if (!fs.existsSync(DATA_FOLDER)) {
		fs.mkdirSync(DATA_FOLDER);
	}
	
	const pagePromises = [];
	for (let i = 1; i <= noOfPages; i++) {
		pagePromises.push(scrapeCollectionPage(i));
	}

	let wallsArr = [];
	try {
		wallsArr = await Promise.all(pagePromises);
	} catch (e) {
		console.log(e);
		return;
	}
	const walls = wallsArr
		.reduce((acc, curr) => acc.concat(curr), [])
		.sort(sortWallsByTimestamp);
	const wallsMeta = { latest: walls[0].timestamp, walls }
	fs.writeFileSync(META_PATH, JSON.stringify(wallsMeta, null, '\t'));
};

const scrapeCollectionPagesAndUpdateMeta = async () => {
	let wallsMeta = JSON.parse(fs.readFileSync(META_PATH));
	let { walls } = wallsMeta;
	let pageWalls = []
	console.log("Checking for updates...")
	for (let i = 1; i <= TOTAL_COLLECTION_PAGES; i++) {
		try {
			pageWalls = await scrapeCollectionPage(i);
		} catch (e) {
			console.log(e);
			return walls;
		}
		const filteredPageWalls = pageWalls.filter(wall => {
			const wallDateObj = getDateObjFromTimestamp(wall.timestamp);
			const wallsMetaLatestDateObj = getDateObjFromTimestamp(wallsMeta.latest);
			
			return (
				wallDateObj > wallsMetaLatestDateObj
			) || (
				wallDateObj.getTime() === wallsMetaLatestDateObj.getTime() &&
				!fs.existsSync(getWallPath(wall.wallFileName, wall.wallExt))
			);
		});
		if (filteredPageWalls.length < 1) { // No latest walls in this page
			console.log(`Stopping update check on page ${i} as no new wallpapers have been found in this page...\n`)
			return;
		}
		walls = walls.concat(filteredPageWalls);
		if (filteredPageWalls.length < pageWalls.length) { // Only some latest walls in this page
			console.log(`Stopping update check on page ${i} as only ${filteredPageWalls.length} out of ${pageWalls.length} wallpapers are new...\n`)
			break;
		}
	}
	walls = walls.sort(sortWallsByTimestamp);
	wallsMeta = { latest: walls[0].timestamp, walls }

	fs.writeFileSync(META_PATH, JSON.stringify(wallsMeta, null, '\t'));
};

const downloadWalls = async (opts) => {
	try {
		if (!fs.existsSync(META_PATH)) {
			await scrapeCollectionPagesAndDownloadMeta(TOTAL_COLLECTION_PAGES);
		} else if (opts.checkForUpdates) {
			await scrapeCollectionPagesAndUpdateMeta();
		}
	} catch (e) {
		console.log(e);
		return;
	}

	const wallsMeta = JSON.parse(fs.readFileSync(META_PATH));
	const { walls } = wallsMeta;
	const noOfWalls = walls.length;

	if (!fs.existsSync(DOWNLOADS_FOLDER)) {
		fs.mkdirSync(DOWNLOADS_FOLDER);
	}
	
	const downloadedNoOfWalls = fs.readdirSync(DOWNLOADS_FOLDER).length;
	const remainingNoOfDownloads = noOfWalls - downloadedNoOfWalls;
	console.log(`${downloadedNoOfWalls} out of the available ${noOfWalls} wallpaper(s) have been downloaded.`);
	if (remainingNoOfDownloads >= 1) {
		console.log(`Downloading the remaining ${remainingNoOfDownloads}...\n`)
	}
	
	for (let i = 0; i < noOfWalls; i++) {
		const wall = walls[i];
		const wallPath = getWallPath(wall.wallFileName, wall.wallExt);

		if (!fs.existsSync(wallPath)) {
			const options = { url: wall.probWallURL, dest: wallPath };
			download
				.image(options)
				.then(({ filename, image }) => {
					console.log("Saved to", filename);
				})
				.catch(err => console.error(err));
		}
	}
};

module.exports = { downloadWalls };