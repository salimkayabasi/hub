var _ = require('lodash');
var mongoose = require('mongoose');
var GDE = mongoose.model('Gde');
var async = require('async');
var log = require('../../../libs/log/')(module);
var request = require('request');
var cheerio = require('cheerio');
var scheduleUrl = 'https://developers.google.com/experts/';

var whoIsThis = function (person, cb) {
  var $ = cheerio.load(person);
  var gde = {};
  gde.name = $('h4').text();
  gde.img = scheduleUrl + $('.person-image').attr('src');
  gde.location = $('.person-location').text();
  gde.role = $('.person-role').text();
  gde.skills = $('.person-skills').text();
  gde.url = $('a').attr('href');
  if (gde.name === 'Salim KAYABASI') {
    log.info(gde.name);
  }
  GDE.findOne({name: gde.name})
    .exec(function (err, result) {
      if (err) {
        log.error(err);
        return cb();
      }
      if (result) {
        _.extend(result, gde);
      } else {
        result = new GDE(gde);
      }
      result.save(function (err) {
        if (err) {
          log.error(err);
        }
        log.info('GDE saved', gde.name);
        return cb();
      });
    });
};

exports.run = function () {
  request(scheduleUrl, function (err, res, body) {
    if (err) {
      return log.error(err);
    }
    if (res.statusCode !== 200) {
      log.error('Error while requesting GDE list');
      return;
    }
    var $ = cheerio.load(body);
    var persons = $('li.person-card a');
    log.info('Total GDE count' + persons.length);
    async.eachSeries(persons, whoIsThis, function (err) {
      log.error(err);
    });
  });
};
