const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const sanitize = require('sanitize-filename');
const download = require('image-downloader');
const prompter = require('keypress-prompt');

const {
	getNthPageURL,
	getWallPath,
	getWallFilename,
	getWallFilenamesFromMeta,
	sortWallsByTimestamp,
} = require('./utils.js');
const { BASE_URL, DATA_FOLDER, META_PATH } = require('./constants.js');
const { SIMPLE_DESKTOPS_DOWNLOADS_FOLDER } = process.env;

let totalScrapedBytes = 0;

const scrapeCollectionPage = async (pageNo) => {
	const pageURL = getNthPageURL(pageNo);
	let response = { data: '' };
	try {
		response = await axios(pageURL);
	} catch (e) {
		console.error(`Error while scraping page ${pageNo}.`);
		if (e.response?.status === 404) {
			throw 'PAGE_NOT_FOUND';
		} else {
			console.error(`\n\nERROR: ${e}\n\n`);
		}
		return [];
	}

	const scrapedBytes = Buffer.byteLength(response.data);
	totalScrapedBytes += scrapedBytes;
	console.log(`Scraped ${scrapedBytes} bytes.`);

	const html = response.data;

	const $ = cheerio.load(html);

	const walls = [];
	let wallObj = {};

	$('div.desktop')
		.contents()
		.each((_, ele) => {
			const html = $(ele).html();
			if (html) {
				if (ele.name === 'a') {
					// Start of a new wall data
					const wallPageURL = `${BASE_URL}${$(ele).attr('href')}`;
					const thumbURL = $(ele).find('img').attr('src');
					const wallTitle = $(ele).find('img').attr('title');

					/* NOTE on probWallURL (probable wall URL):
					 ** I was originally scraping the wallPageURL to get the static URL of
					 ** the corresponding wallpaper; however, I found that the thumbnail URLs
					 ** in collection pages already contain a part of the full wallpaper's static URL!
					 ** Less scraping FTW!
					 */
					const probWallURL = thumbURL?.split('.295x184')[0];

					const wallURLParts = probWallURL.split('/');

					// YYYY-MM-DD
					const timestamp = `${wallURLParts[5]}-${wallURLParts[6]}-${wallURLParts[7]}`;
					const wallOriginalFilename = wallURLParts[8];

					const wallOriginalFilenameParts = wallOriginalFilename.split('.');
					const isExtPresent = wallOriginalFilenameParts.length > 1;

					const wallExt = isExtPresent ? '.' + wallOriginalFilenameParts.pop() : '';

					wallObj = {
						wallPageURL,
						timestamp,
						thumbURL,
						probWallURL,
						wallTitle,
						wallOriginalFilename,
						wallExt,
						wallFilename: `${timestamp} - ${sanitize(wallTitle)}`,
					};
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

const scrapeCollectionPagesForMeta = async () => {
	if (!fs.existsSync(DATA_FOLDER)) {
		fs.mkdirSync(DATA_FOLDER);
	}

	let wallsMeta = !fs.existsSync(META_PATH) ? { walls: [] } : JSON.parse(fs.readFileSync(META_PATH));
	let { walls } = wallsMeta;
	const existingWallFilenames = getWallFilenamesFromMeta(walls);

	console.log('\nChecking for updates...');
	let newWalls = [],
		PAGE_NOT_FOUND = false,
		pageIdx = 0;
	while (!PAGE_NOT_FOUND) {
		pageIdx += 1;
		console.log(`\nScraping page ${pageIdx}...`);

		let pageWalls = [];
		try {
			pageWalls = await scrapeCollectionPage(pageIdx);
		} catch (error) {
			console.log({ error });
			if (error === 'PAGE_NOT_FOUND') {
				PAGE_NOT_FOUND = true;
			}
		}

		if (!pageWalls?.length) {
			continue;
		}

		const filteredPageWalls = pageWalls.filter(
			(wall) => !existingWallFilenames.includes(getWallFilename(wall.wallFilename, wall.wallExt))
		);
		newWalls = newWalls.concat(filteredPageWalls);

		if (filteredPageWalls.length < pageWalls.length) {
			console.log(
				`\n${
					!filteredPageWalls.length
						? 'None of the'
						: `Only ${filteredPageWalls.length} wallpaper(s) out of the ${pageWalls.length}`
				} wallpaper(s) on page ${pageIdx}, ${filteredPageWalls.length === 1 ? 'is' : 'are'} new (not in meta).`
			);
			console.log(
				'In all likeliness this means that there would not be any new wallpapers in the pages further.'
			);
			const choice = await prompter.prompt(
				`\nYou should press "y" to stop scraping. Press "n" to continue scraping.`,
				['y', 'n']
			);
			if (choice === 'y') {
				break;
			}
		} else {
			console.log(
				`Found ${filteredPageWalls.length} new wallpapers (that were not in meta), on page ${pageIdx}.\n`
			);
		}
	}

	console.log(`\nTotal scraped bytes: ${totalScrapedBytes}`, `(${totalScrapedBytes / (1024 * 1024)} MB)\n`);

	if (newWalls.length === 0) {
		return;
	}

	walls = newWalls.concat(walls).sort(sortWallsByTimestamp);
	wallsMeta = { latest: walls[0].timestamp, walls };

	fs.writeFileSync(META_PATH, JSON.stringify(wallsMeta, null, '\t'));
	console.log(`Updated meta with the data from ${newWalls.length} new walls.`);
};

const downloadWalls = async () => {
	if (
		!fs.existsSync(META_PATH) ||
		(process.env.SIMPLE_DESKTOPS_CHECK_FOR_UPDATES && process.env.SIMPLE_DESKTOPS_CHECK_FOR_UPDATES !== 'false')
	) {
		await scrapeCollectionPagesForMeta();
	}

	const wallsMeta = JSON.parse(fs.readFileSync(META_PATH));
	const { walls } = wallsMeta;
	const wallFilenames = getWallFilenamesFromMeta(walls);
	const noOfWalls = new Set(wallFilenames).size;

	if (!fs.existsSync(SIMPLE_DESKTOPS_DOWNLOADS_FOLDER)) {
		fs.mkdirSync(SIMPLE_DESKTOPS_DOWNLOADS_FOLDER);
	}

	const downloadedNoOfWalls = (() => {
		const downloadsFolderFiles = fs.readdirSync(SIMPLE_DESKTOPS_DOWNLOADS_FOLDER);
		return (
			downloadsFolderFiles.length -
			downloadsFolderFiles.filter((filename) => !wallFilenames.includes(filename)).length
		);
	})();

	const remainingNoOfDownloads = noOfWalls - downloadedNoOfWalls;
	console.log(`${downloadedNoOfWalls} out of the available ${noOfWalls} wallpaper(s) have already been downloaded.`);

	if (remainingNoOfDownloads >= 1) {
		console.log(`Downloading the remaining ${remainingNoOfDownloads} wallpaper(s), now...\n`);
		for (let i = 0; i < noOfWalls; i++) {
			const wall = walls[i];
			if (wall) {
				const wallPath = getWallPath(wall.wallFilename, wall.wallExt);

				if (!fs.existsSync(wallPath)) {
					const options = { url: wall.probWallURL, dest: wallPath };
					download
						.image(options)
						.then(({ filename, image }) => {
							console.log('Saved to', filename);
						})
						.catch((err) => console.error(err));
				}
			}
		}
	}
};

module.exports = { downloadWalls };
