var moment = require('moment');
var mongoose = require('mongoose');
var utils = require(process.cwd() + '/libs/mongoose/util');

exports.findById = utils.getModel('Chapter', {_id: 'chapterId'}, [['country', 'name']], true);
exports.list = utils.getModel('Chapter', {}, [['country', 'name']]);
exports.byCountry = utils.getModel('Chapter', {country: 'country'}, [['country', 'name']]);
exports.posts = utils.getModel('PlusPost', {chapter: 'chapterId'});
exports.postsByTag = utils.getModel('PlusPost', {
  chapter: 'chapterId',
  hashtags: 'hashtags'
});
exports.nearBy = function (req, res) {
  if (!req.params.lat || !req.params.lng) {
    return res.send(500, 'Please specify lat and lng');
  }
  mongoose.connection.db.executeDbCommand({
    geoNear: 'chapters',  // the mongo collection
    near: [parseFloat(req.params.lng), parseFloat(req.params.lat)], // the geo point
    spherical: true,  // tell mongo the earth is round, so it calculates based on a spherical location system
    distanceMultiplier: 6371, //6378.137,
    maxDistance: parseFloat(req.params.maxDistance) / 6371
  }, function (err, result) {
    if (err) {
      console.error(err);
      return res.send(500, 'Internal Server Error');
    }
    res.jsonp(result.documents[0].results);
  });
};
exports.events = utils.getModel('Event', {chapter: 'chapterId'});
exports.eventsUpcoming = utils.getModel('Event', {
  chapter: 'chapterId',
  start: {'$gte': new Date()}
});
exports.eventsPast = utils.getModel('Event', {
  chapter: 'chapterId',
  end: {'$lt': new Date()}
});
exports.eventsThisMonth = utils.getModel('Event', {
  chapter: 'chapterId',
  start: {'$gt': moment().date(1).minutes(0).seconds(0).milliseconds(0)},
  end: {'$lt': moment().add(1, 'month').date(0).minutes(0).seconds(0).milliseconds(0)}
});
exports.eventsByMonth = function (req, res) {
  utils.getModel('Event', {
    chapter: 'chapterId',
    start: {'$gt': moment().year(req.params.year).month(req.params.month).date(1).hours(0).minutes(0).seconds(0).milliseconds(0)},
    end: {'$lt': moment().year(req.params.year).month(req.params.month).add('months', 1).date(0).minutes(0).seconds(0).milliseconds(0)}
  })(req, res);
};
exports.eventsByDate = function (req, res) {
  utils.getModel('Event', {
    chapter: 'chapterId',
    start: {'$gt': req.params.start},
    end: {'$lt': req.params.end}
  })(req, res);
};
exports.eventsByTag = utils.getModel('Event', {
  chapter: 'chapterId',
  tags: 'tag'
});
exports.eventsByStats = function (req, res) {
  Event.aggregate([
    {$match: {chapter: req.params.chapterId}}, /* Query can go here, if you want to filter results. */
    {$project: {tags: 1}}, /* select the tokens field as something we want to 'send' to the next command in the chain */
    {$unwind: '$tags'}, /* this converts arrays into unique documents for counting */
    {
      $group: {
        /* execute 'grouping' */
        _id: '$tags', /* using the 'token' value as the _id */
        count: {$sum: 1} /* create a sum value */
      }
    }
  ], function (err, tags) {
    res.jsonp(tags);
  });
};
