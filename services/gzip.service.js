/** @format */

"use strict";

const request = require("request");
const zlib = require("zlib");
const log = require("./log.service")("services:gzipservice");
const util = require("util");

const space = /\s+/;

const gunzipUrlArr = async (arr) => {
    const gunzippedUrls = await gunzipUrls(arr);
    const gunzipArr = gunzippedUrls.flat(Infinity).filter((url) => url !== null);
    const gunzippedUrlArr = gunzipArr.filter((url) => url.slice(-2) === "gz");
    if (gunzippedUrlArr.length > 0) {
        const nestedGunZipArr = await gunzipUrlArr(gunzippedUrlArr);
        return gunzipArr.concat(nestedGunZipArr);
    } else {
        return gunzipArr;
    }
};

const gunzipUrls = (arr) => {
    return Promise.all(
        arr.map((siteMapUrl) => {
            if (siteMapUrl.slice(-2) === "gz") {
                const gunzipArr = reqGzipPage(siteMapUrl);
                return gunzipArr;
            } else {
                return siteMapUrl;
            }
        })
    );
};

const reqGzipPage = (url) => {
    return new Promise(async (resolve, reject) => {
        request(url, { encoding: null }, async (err, res, body) => {
            if (err) reject(err);
            await gunzipPage(body)
                .then((body) => resolve(body))
                .catch((err) => reject(err));
        });
    });
};

const gunzipPage = (body) => {
    return new Promise(async (resolve, reject) => {
        zlib.gunzip(body, (err, unzipped) => {
            if (err) {
                if (err.message === "incorrect header check") {
                    resolve(null);
                } else reject(err);
            } else {
                const unzippedSiteMap = unzipped.toString();
                const unzippedSiteMapArr = unzippedSiteMap.split(space);
                const scrapedSiteMapXmlElementArr = unzippedSiteMapArr.filter(
                    (text) => text.slice(-6) === "</loc>"
                );
                const scrapedSiteMapUrlArr = scrapedSiteMapXmlElementArr.map((text) =>
                    text.slice(5, text.length - 6)
                );
                resolve(scrapedSiteMapUrlArr);
            }
        });
    });
};

module.exports = gunzipUrlArr;
