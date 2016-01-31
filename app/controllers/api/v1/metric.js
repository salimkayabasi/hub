var mongoose = require('mongoose');
var utils = require(process.cwd() + '/libs/mongoose/util');
var DailyMetric = mongoose.model('DailyMetric');
var MonthlyMetric = mongoose.model('MonthlyMetric');
var async = require('async');

exports.daily = utils.getModel('DailyMetric', {
  subject: 'subject',
  type: 'metric',
  year: 'year',
  month: 'month'
}, null, true);
exports.byType = function (req, res) {
  async.series([
      function (callback) {
        DailyMetric.aggregate([
          {$match: {}},
          {
            $group: {
              /* execute 'grouping' */
              _id: '$type', /* using the 'token' value as the _id */
              subjectTypes: {$addToSet: '$subjectType'} /* create a sum value */
            }
          }
        ], function (err, items) {
          callback(err, items);
        });
      },
      function (callback) {
        MonthlyMetric.aggregate([
          {$match: {}},
          {
            $group: {
              /* execute 'grouping' */
              _id: '$type', /* using the 'token' value as the _id */
              subjectTypes: {$addToSet: '$subjectType'} /* create a sum value */
            }
          }
        ], function (err, items) {
          callback(err, items);
        });
      }
    ],
    // optional callback
    function (err, results) {
      res.jsonp({
        daily: results[0],
        monthly: results[1]
      });
    });

};
