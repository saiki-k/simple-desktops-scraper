# Simple Desktop Scrapper

## What...

Go visit [http://simpledesktops.com](http://simpledesktops.com)! They've – arguably - the best collection of minimal, beautiful, abstract art-esque wallpapers! I absolutely adore the official [Simple Desktops for Mac](http://simpledesktops.com/app/mac/) app; which cycles through a humongous collection of 1400+ such aforementioned wallpapers, at a set frequency.

When one of my friends was visibly quite bummed at the lack of something similar for other operating systems(such as Windows); we thought it best to scrape all the wallpapers and have the stock wallpaper manager manage these.

Hence, this scraper.

For Linux, you can check out [Shotwell](https://wiki.gnome.org/Apps/Shotwell) – a personal photo manager which can setup a desktop slideshow. You can find the relevant instructions [here](https://linuxconfig.org/ubuntu-20-04-wallpaper-slideshow#:~:text=Ubuntu%2020.04%20wallpaper%20slideshow%20step%20by%20step%20instructions&text=Start%20shotwell%20image%20viewer%20application%20using%20the%20Activities%20menu.&text=While%20all%20the%20the%20images,between%20each%20automatic%20wallpaper%20change.)



## How to...

- Please ensure that NodeJS is installed on your computer.

- Run the following commands to start downloading the wallpapers.

```bash
npm install
npm run start
```

- The wallpapers are downloaded to the folder `./data/simple_desktops`.

- You can run `npm run start` as many times as you wish (either in case of errors, or downloads that stop midway). Wallpapers which have already been downloaded, won't be downloaded again.

- You can also periodically run `npm run start` to check for new wallpaper updates (and download them).

## Please...

Be a good netizen, and do use the scraped data for absolutely-personal purposes only! [Use of these desktop wallpapers is for personal use only, and shouldn't be sold or reposted without the expressed written consent of the desktop creator.](http://simpledesktops.com/about/)

## Credit where credit's due...

Thanks to [Nikhil Astakala](https://github.com/astak15) for getting visibly bummed out, every now and then.
