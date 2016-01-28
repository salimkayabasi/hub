var log = require('../../../libs/log')(module);
var util = require('util');
var config = require('config');
var mongoose = require('mongoose');
var _ = require('lodash');
var Chapter = mongoose.model('Chapter');
var request = require('request');
var async = require('async');
var cheerio = require('cheerio');
var chaptersUrl = 'https://developers.google.com/groups/directorygroups/';
var chapterGPlusUrl = 'https://plus.google.com/%s/about';

var getOrganizers = function (gPlusId, cb) {
  var url = util.format(chapterGPlusUrl, gPlusId);
  request(url, function (err, res, body) {
    if (err) {
      log.error(err);
      return cb(err);
    }
    if (res.statusCode !== 200) {
      err = new Error('Unexpected error while requesting organizers');
      log.error(err);
      return cb(err);
    }
    var $ = cheerio.load(body);
    var links = _.map($('a.OLa.url.Xvc'),
      function (organizer) {
        var $ = cheerio.load(organizer);
        var elem = $('a');
        return {
          name: elem.text(),
          'gplus_url': elem.attr('href'),
          photo: ''
        };
      });
    var organizers = _.filter(links, function (link) {
      return link.gplus_url.indexOf('plus.google.com') !== -1 &&
        link.gplus_url.indexOf('communities') === -1;
    });
    cb(null, organizers);
  })
};

exports.run = function () {
  request.get(chaptersUrl, function (err, res, body) {
    if (err) {
      log.error(err);
      return;
    }
    body = JSON.parse(body);
    if (res.statusCode !== 200 || !body.success) {
      log.error('Unexpected error while requesting chapters');
      return;
    }
    log.info('Fetching Chapters : ', body.groups.length);
    async.eachSeries(body.groups, function (_chapter, cb) {
      log.info('Fetching data of', _chapter.name);
      Chapter
        .findOne({_id: _chapter.gplus_id})
        .exec(function (err, chapter) {
          if (!chapter) {
            chapter = new Chapter();
            chapter._id = _chapter.gplus_id;
          }
          _.assign(chapter, _.omit(_chapter, 'geo'));
          if (_chapter.geo && _chapter.geo.lng && _chapter.geo.lat) {
            chapter.geo = [_chapter.geo.lng, _chapter.geo.lat];
          }
          getOrganizers(chapter.gplus_id, function (err, organizers) {
            if (!err && organizers && organizers.length) {
              chapter.organizers = organizers;
            }
            chapter.save(cb);
          });
        });
    }, function (err) {
      if (err) {
        return log.info(err);
      }
      log.info('All chapters done');
    });
  });
};
