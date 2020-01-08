const cheerio = require("cheerio");
const axios = require('axios');
const puppeteer = require("puppeteer");
const download = require("image-downloader");

const getPageNURL = n => `http://simpledesktops.com/browse/${n}/`;
const pageURL = getPageNURL(1);
const wallPageURL =
	"http://simpledesktops.com/browse/desktops/2019/oct/23/random-triangle/";

// puppeteer
// 	.launch()
// 	.then(browser => console.log("Opening new page...") || browser.newPage())
// 	.then(page => {
// 		console.log(`Visiting ${wallPageURL}...`);
// 		return page.goto(wallPageURL).then(function() {
// 			return page.content();
// 		});
// 	})
axios(wallPageURL)
	.then(response => {
		const html = response.data;
		console.log("Loading cheerio...\n");
		const $ = cheerio.load(html);
		$("div.desktop")
			.contents()
			.each((idx, ele) => {
				const html = $(ele).html();
				let wallURL = '';
				if (html) {
					console.log(ele.name);
					console.log(html);
					console.log();
					if (ele.name === 'a') {
						console.log("Big Thumbnail URL:", $(ele).find('img').attr('src'));
					}
					if (ele.name === 'h2') {
						console.log("Wallpaper URL:", $(ele).find('a').attr('href'));
						wallURL = `http://simpledesktops.com/${$(ele).find('a').attr('href')}`;
						const options = {
							url: wallURL,
							dest: "simple_desktops"
						};
						download
							.image(options)
							.then(({ filename, image }) => {
								console.log("Saved to", filename); // Saved to /path/to/dest/image.jpg
							})
							.catch(err => console.error(err));
					}
				}
				// axios(`http://simpledesktops.com${$(ele).find('a').attr('href')}`).then(r => {
				// 	console.log(r.data);
				// })
				

			});
		
		
	})
	.catch(console.error);

// puppeteer
// 	.launch()
// 	.then(browser => console.log("Opening new page...") || browser.newPage())
// 	.then(page => {
// 		console.log(`Visiting ${pageURL}...`);
// 		return page.goto(pageURL).then(function() {
// 			return page.content();
// 		});
// 	})
// 	.then(html => {
// 		console.log("Loading cheerio...")
// 		const $ = cheerio.load(html);

// 		let count = 0;
// 		$("div.desktop").contents().each((idx, ele) => {
// 			const html = $(ele).html();
// 			if (html) {
// 				if (ele.name === 'a') {
// 					console.log("Wallpaper Page:", $(ele).attr('href'));
// 					console.log("Thumbnail:", $(ele).find('img').attr('src'))
// 					console.log("Title:", $(ele).find('img').attr('title'))
// 					console.log("Alt:", $(ele).find('img').attr('alt'))
// 				}
// 				if (ele.name === 'span') {
// 					console.log("Author:", $(ele).find('a').text())
// 					console.log("Author Website:", $(ele).find('a').attr('href'))
// 					console.log();
// 					count += 1;
// 				}

// 			}
// 		});
// 		console.log(`${count} wallpaper(s) found on this page!`);
// 	})
// 	.catch(console.error);
