'use strict';

var mongoose = require('mongoose');
var request = require('superagent');
var moment = require('moment');
var config = require('config');
var TimeQueue = require('timequeue');
var async = require('async');
var Chapter = mongoose.model('Chapter');
var Country = mongoose.model('Country');
var Event = mongoose.model('Event');
var geocoder = require('node-geocoder')
  .getGeocoder('google', 'https', {apiKey: config.keys.google.simpleApiKey});

require('superagent-retry')(request);

var geocodeWorker = function (location, callback) {
  // TODO use promise here instead of callback
  geocoder.geocode(location, callback);
};

var plusWorker = function (url, callback) {
  request.get(url).retry(2).end(function (err, res) {
    if (err) {
      log.info(err);
    }
    callback(err, err ? null : res.body);
  });
};

var geocodeQueue = new TimeQueue(geocodeWorker, {concurrency: 3, every: 1000});
var plusQueue = new TimeQueue(plusWorker, {concurrency: 4, every: 1000});

module.exports = {
  fetchChapters: function (callback) {
    if (!callback) {
      return;
    }

    var chapters = [];
    request.get('https://developers.google.com/groups/directorygroups/').retry(5).end(function (err, res) {
      var response = res.body;
      async.each(response.groups, function (rawChapter, groupCallback) {

        // jshint -W106
        Chapter.findOne({_id: rawChapter.gplus_id}, function (err, chapter) {
          var isNew = !chapter;

          if (isNew) {
            chapter = new Chapter();
            chapter._id = rawChapter.gplus_id;
          }

          var processChapter = function (chapter) {
            Country.findOne({name: rawChapter.country}, function (err, country) {
              chapter.name = rawChapter.name;
              chapter.city = rawChapter.city;
              chapter.state = rawChapter.state;
              chapter.country = country ? country._id : rawChapter.country;
              chapter.group_type = rawChapter.group_type;
              chapter.status = rawChapter.status;
              chapter.site = rawChapter.site;
              chapters.push(chapter);

              groupCallback(null);
            });
          };
          // jshint +W106

          plusQueue.push('https://www.googleapis.com/plus/v1/people/' + chapter._id + '?fields=urls&key=' +
            config.keys.google.simpleApiKey, function (err, res) {
            if (err) {
              log.info(err);
              return;
            }

            var gplusResponse = res;
            var organizers = [];
            var lookup = [];
            if (gplusResponse.urls) {
              for (var i = 0; i < gplusResponse.urls.length; i++) {
                var link = gplusResponse.urls[i];

                if (link.value.indexOf('plus.google.com') !== -1 && link.value.indexOf('communities') === -1) {
                  lookup.push(link.value);
                }
              }
            } else {
              log.info('got no links from gplus: ' + 'https://www.googleapis.com/plus/v1/people/' + chapter._id +
                '?fields=urls&key=' + config.keys.google.simpleApiKey);
              log.info(res);
            }

            if (!lookup.length) {
              log.info('no organizers found in: ');
              log.info(gplusResponse.urls);
            }
            async.each(lookup, function (url, callback) {
              // G+ ID
              var idRegex = /([0-9]{21})|(\+[^\/]+)/g;
              var result = null;
              var found;
              // TODO clean this up!
              while (found = idRegex.exec(url)) { // jshint ignore:line
                result = found[0];
              }
              if (result) {
                plusQueue.push('https://www.googleapis.com/plus/v1/people/' + result + '?fields=objectType,id&key=' +
                  config.keys.google.simpleApiKey, function (err, res) {
                  if (err) {
                    callback(err);
                  } else {
                    if (res.objectType === 'person') {
                      organizers.push(res.id);
                    }
                    callback(null);
                  }
                });
              } else {
                log.info('unknown url: ' + url);
                callback(null);
              }
            }, function () {
              chapter.organizers = organizers;

              if (!chapter.organizers.length) {
                log.info('zero organizers for chapter ' + chapter._id + ', ' + rawChapter.name);
              }

              if (rawChapter.geo && ((rawChapter.geo && rawChapter.geo.lng) || (!isNew && chapter.geo ))) {
                chapter.geo = {
                  lng: rawChapter.geo.lng,
                  lat: rawChapter.geo.lat
                };
                processChapter(chapter);
              } else {
                geocodeQueue.push(chapter.city + ', ' + chapter.country, function (err, data) {
                  if (err) {
                    log.info(err);
                  }

                  if (!err && data.length > 0) {
                    chapter.geo = {
                      lng: data[0].longitude,
                      lat: data[0].latitude
                    };
                  }

                  processChapter(chapter);
                });
              }
            });
          });
        });
      }, function (err) {
        log.info('all chapters done');
        log.info(err);
        callback(err, chapters);
      });
    });
  },
  fetchTags: function (callback) {
    if (!callback) {
      return;
    }
    request.get('https://developers.google.com/tags/gettags').retry(5).end(function (err, res) {
      if (err) {
        return callback(err, null);
      }

      callback(null, res.body);
    });
  },
  fetchTaggedEvents: function (tag, month, year, callback) {
    if (!callback) {
      return;
    }

    month = month || moment().month();
    year = year || moment().year();

    var end = moment().year(year).month(month).add(1, 'months').date(10).seconds(0).minutes(0).hours(0).unix();
    var start = moment().year(year).month(month).date(1).subtract(10, 'days').seconds(0).minutes(0).hours(0).unix();

    var now = moment().unix();
    request.get('https://google-developers.appspot.com/events/event-markers.public?tag=' + tag +
      '&start=' + start + '&end=' + end + '&_=' + now).retry(5).end(function (err, res) {
      if (err) {
        return callback(err, null);
      }

      callback(null, res.body);
    });
  },
  fetchEventsForChapter: function (start, end, chapterId, callback) {

    start = start || moment().add(1, 'months').date(1).subtract(1, 'days').seconds(0).minutes(0).hours(0).unix();
    end = end || moment().date(1).seconds(0).minutes(0).hours(0).unix();

    request.get('https://developers.google.com/events/feed/json?group=' + chapterId +
      '&start=' + start + '&end=' + end).retry(5).end(function (error, result) {
      if (error) {
        if (callback) {
          callback(error);
        }
        return;
      }

      var eventList = result.body;

      if (!eventList.length && callback) {
        return callback(null, []);
      }

      var events = [];
      if (eventList && eventList instanceof Array) {
        async.each(eventList,
          function (rawEvent, eventCallback) {
            Event.findOne({_id: rawEvent.id}, function (err, event) {
              var isNew = !event;

              if (isNew) {
                event = new Event();
                event._id = rawEvent.id;
              }

              var processEvent = function (event) {

                event.chapter = chapterId;
                event.start = new Date(rawEvent.start);
                event.end = new Date(rawEvent.end);
                event.allDay = rawEvent.allDay ? true : false;
                event.title = rawEvent.title;
                event.iconUrl = rawEvent.iconUrl;
                event.eventUrl = rawEvent.gPlusEventLink;
                event.timezone = rawEvent.timezoneName;

                if (rawEvent.participantsCount) {
                  event.participants = rawEvent.participantsCount;
                }

                if (rawEvent.description) {
                  event.about = rawEvent.description.trim().replace(/\n/g, '<br />');
                }

                events.push(event);

                eventCallback(null);
              };

              if (!isNew && rawEvent.location === event.location) {
                processEvent(event);
              } else {
                event.location = rawEvent.location;
                geocodeQueue.push(rawEvent.location, function (err, data) {
                  if (err) {
                    log.info(err);
                  }

                  if (!err && data.length > 0) {
                    event.geo = {lng: data[0].longitude, lat: data[0].latitude};
                  }

                  processEvent(event);
                });
              }

            });
          },
          function () {
            callback(null, events);
          }
        );

      } else {
        log.info(result.body);
        return callback(null, []);
      }
    });
  }
};
