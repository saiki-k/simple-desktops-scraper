const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const download = require("image-downloader");
const sanitize = require("sanitize-filename");

const { getPageN } = require('./utils.js');
const { BASE_URL, MAX_COLLECTION_PAGES } = require('./constants.js');

const scrapeWallPage = async (wallPageURL) => {
	const response = await axios(wallPageURL);
	const html = response.data;

	const $ = cheerio.load(html);
	let wallObj = {};
	
	$("div.desktop")
		.contents()
		.each((idx, ele) => {
			const html = $(ele).html();
			if (html) {
				if (ele.name === 'a') {
					// Start of the wall data
					wallObj = { bigThumbURL: $(ele).find('img').attr('src') };
				}
				if (ele.name === 'h2') {
					const downloadURL = `${BASE_URL}${$(ele).find('a').attr('href')}`;
					const wallID = downloadURL.split('=')[1];
					wallObj = Object.assign({}, wallObj, { downloadURL, wallID });
					return; // End of the wall data
				}
			}
		});
	
	// console.log(wallObj);
	return wallObj;
}

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

				wallObj = Object.assign({}, wallObj, {
					wallPageURL,
					timeStamp,
					thumbURL,
					probWallURL: `${thumbURL.split('.png')[0]}.png`,
					wallTitle: $(ele).find('img').attr('title'),
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
	const wallPagePromises = walls.map(wall => scrapeWallPage(wall.wallPageURL));
	const wallPageData = await Promise.all(wallPagePromises);
	
	const wallsWithWallPageData = walls.map((wall, idx) => Object.assign(
		{}, wall, wallPageData[idx]
	));
	
	// console.log(wallsWithWallPageData.sort((wallA, wallB) => parseInt(wallA.wallID, 10) - parseInt(wallB.wallID, 10)));	
	return wallsWithWallPageData
		.sort((wallA, wallB) => parseInt(wallA.wallID, 10) - parseInt(wallB.wallID, 10));
};

const scrapeCollectionPages = async (noOfPages, startPage = 1) => {
	const pagePromises = [];
	for (let i = startPage; i < startPage + noOfPages; i++) {
		pagePromises.push(scrapeCollectionPage(i));
	}
	const wallsArr = await Promise.all(pagePromises);
	const walls = wallsArr.reduce((acc, curr) => acc.concat(curr), []);
	// console.log(walls, walls.length);
	return walls;
};

// TODO: Needs a better implementation...
const downloadInfo = async (noOfPages, startPage = 1, concat = true) => {
	let wallsData = concat
		? JSON.parse(fs.readFileSync('../data/simple-desktops.json') || [])
		: [];
	const newData = await scrapeCollectionPages(noOfPages, startPage);
	const newDataPlusOldData = wallsData.concat(newData);

	console.log({ newDataLength: newData.length, combinedLength: newDataPlusOldData.length });
	fs.writeFileSync(
		'../data/simple-desktops.json',
		JSON.stringify(wallsData.concat(newData))
	);
}

const downloadWalls = async (noOfWalls, startWall = 0) => {
	const wallsData = JSON.parse(fs.readFileSync('../data/simple-desktops.json'));
	console.log(wallsData.length);
	for (let i = startWall; i < startWall + noOfWalls; i++) {
		const wall = wallsData[i];
		const dest = `../data/simple_desktops/(${wall.wallID}) ${sanitize(wall.wallTitle)}.png`;
		const options = {
			url: wall.probWallURL,
			dest
		};

		fs.access(dest, fs.F_OK, (err) => {
			if (!err) {
				// file exists
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

downloadWalls(1413);
// downloadInfo(1, 51);
// scrapeWallPage('http://simpledesktops.com/browse/desktops/2016/jul/24/modern-labyrinth/');
// scrapeCollectionPages(2);
// scrapeCollectionPage(52);