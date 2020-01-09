const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const sanitize = require("sanitize-filename");
const download = require("image-downloader");

const { getNthPageURL, getWallPath } = require('./utils.js');
const {
	BASE_URL,
	TOTAL_COLLECTION_PAGES,
	DATA_FOLDER,
	DOWNLOADS_FOLDER,
	META_PATH
} = require('./constants.js');

const scrapeCollectionPage = async (pageNo) => {
	const pageURL = getNthPageURL(pageNo);
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

	return walls;
};

const scrapeCollectionPagesAndDownloadMeta = async (noOfPages) => {
	if (!fs.existsSync(DATA_FOLDER)) {
		fs.mkdirSync(DATA_FOLDER);
	}
	
	const pagePromises = [];
	for (let i = 1; i <= noOfPages; i++) {
		pagePromises.push(scrapeCollectionPage(i));
	}
	const wallsArr = await Promise.all(pagePromises);
	const walls = wallsArr
		.reduce((acc, curr) => acc.concat(curr), [])
		.sort((wallA, wallB) => {
			const [yearA, monthA, dayA] = wallA.timestamp.split('-');
			const dateA = new Date(
				parseInt(yearA, 10), parseInt(monthA, 10), parseInt(dayA, 10)
			);
			const [yearB, monthB, dayB] = wallB.timestamp.split('-');
			const dateB = new Date(
				parseInt(yearB, 10), parseInt(monthB, 10), parseInt(dayB, 10)
			);
			return dateB - dateA;
		});
	const wallsMeta = { latest: walls[0].timestamp, walls }

	fs.writeFileSync(META_PATH, JSON.stringify(wallsMeta, null, '\t'));
};

const downloadWalls = async () => {
	if (!fs.existsSync(META_PATH)) {
		await scrapeCollectionPagesAndDownloadMeta(TOTAL_COLLECTION_PAGES);
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
		console.log(`Downloading the remaining ${remainingNoOfDownloads}...`)
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
}

module.exports = { downloadWalls };