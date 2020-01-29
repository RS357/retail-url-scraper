'use strict'; 

const request = require('request');
const zlib = require('zlib');
const log = require('./log.service')('services:gzipservice');
const util = require('util');

const gunzipUrlArr = async arr => {
  const gunzipUnflatArr = await gunzipUrls(arr);
  log(`gunzipUnflatArr: ${util.inspect(gunzipUnflatArr)}`);
  const gunzipArr = gunzipUnflatArr.flat(Infinity);
  const gunzippedUrlArr = gunzipArr.filter(url => url.slice(-2) === 'gz');
  if (gunzippedUrlArr.length > 0) {
    const nestedGunZipArr = gunzipUrlArr(gunzippedUrlArr);
    gunzipArr.concat(nestedGunZipArr);
    return gunzipArr;
  }
  else {
    return gunzipArr;
  }
};

const gunzipUrls = arr => {
  return Promise.all(
    arr.map(siteMapUrl => {
      if (siteMapUrl.slice(-2) === 'gz') {
        const gunzipArr = reqGzipPage(siteMapUrl);
        return gunzipArr;
      }
      else {
        return siteMapUrl;
      }
    })
  ); 
}

const reqGzipPage = url => {
  return new Promise(async (resolve, reject) => {
    request(url, {encoding: null}, async (err, res, body) => {
      if (err) reject(err);
      await gunzipPage(body)
        .then(body => resolve(body))
        .catch(err => reject(err))
    });
  });
};

const gunzipPage = body => {
  return new Promise(async (resolve, reject) => {
    zlib.gunzip(body, (err, unzipped) => {
      if (err) reject(err);
      const unzippedSiteMap = unzipped.toString();
      const space = /\s+/;
      const unzippedSiteMapArr = unzippedSiteMap.split(space);
      const scrapedSiteMapXmlElementArr = unzippedSiteMapArr.filter(text => text.slice(-6) === '</loc>')
      const scrapedSiteMapUrlArr = scrapedSiteMapXmlElementArr.map(text => text.slice(5, text.length - 6));
      resolve(scrapedSiteMapUrlArr);
    });
  });
};

module.exports = gunzipUrlArr;
