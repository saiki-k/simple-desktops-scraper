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

const scrapeCollectionPagesAndDownloadMeta = async (noOfPages) => {
	if (!fs.existsSync(DATA_FOLDER)) {
		fs.mkdirSync(DATA_FOLDER);
	}
	
	const pagePromises = [];
	for (let i = 1; i <= noOfPages; i++) {
		pagePromises.push(scrapeCollectionPage(i));
	}
	const wallsArr = await Promise.all(pagePromises);
	const wallsMeta = wallsArr.reduce((acc, curr) => acc.concat(curr), []);

	fs.writeFileSync(META_PATH, JSON.stringify(wallsMeta));
};

const downloadWalls = async () => {
	if (!fs.existsSync(META_PATH)) {
		await scrapeCollectionPagesAndDownloadMeta(TOTAL_COLLECTION_PAGES);
	}
	
	const wallsData = JSON.parse(fs.readFileSync(META_PATH));
	const noOfWalls = wallsData.length;

	if (!fs.existsSync(DOWNLOADS_FOLDER)) {
		fs.mkdirSync(DOWNLOADS_FOLDER);
	}
	
	console.log(`${wallsData.length} wallpaper(s) available...`);
	console.log(`${fs.readdirSync(DOWNLOADS_FOLDER).length} wallpaper(s) have been downloaded...`)
	
	for (let i = 0; i < noOfWalls; i++) {
		const wall = wallsData[i];
		const wallPath = getWallPath(wall.wallFileName);

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

downloadWalls();