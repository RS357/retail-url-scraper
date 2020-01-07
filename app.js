'use strict'; 

const createError = require('http-errors');
const express = require('express');
const app = express();
const requestRobotsTxtFiles = require('./services/robots.service');
const gzipArrs = require('./services/gzip.service');
const readXml = require('./services/readxml.service');
const log = require('debug')('app');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.json('Welcome to the express app')
});

app.get('/site-urls/:lookUpUrl', async (req, res, next) => {
  const lookUpUrl = req.params.lookUpUrl;
  const siteMapArr = await requestRobotsTxtFiles(lookUpUrl);
  const nestedSitemapUrlArr = await gzipArrs(siteMapArr[0]); 
  const urlArr = await readXml(nestedSitemapUrlArr);
  log(urlArr);
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});

module.exports = app;
