var mongoose = require('mongoose');
var config = require('config');
var DailyMetric = mongoose.model('DailyMetric');
var moment = require('moment');
var risky = require(process.cwd() + '/libs/risky');

exports.runTasks = function (req, res) {
  // jshint -W106
  risky.sendTask(req.body.task_type, req.body.params,
    function (err, id) {
      if (err) {
        return res.send(500, 'Not executing task.');
      }

      res.jsonp({msg: 'task_runs', taskId: id});
    },
    null, true);
  // jshint +W106
};
exports.getCluster = function (req, res) {
  res.jsonp(risky.getCluster());
};
exports.fixMetrics = function (req, res) {

  DailyMetric.find({}, function (err, metrics) {
    for (var i = 0; i < metrics.length; i++) {
      var metric = metrics[i];

      var daysInMonth = moment(metric.year + '-' + metric.month, 'YYYY-M').daysInMonth();
      for (var j = 1; j <= daysInMonth; j++) {
        var date = moment(metric.year + '-' + metric.month + '-' + j, 'YYYY-M-D');

        if (date.isBefore(moment().subtract('days', 1))) {
          if (metric.values[j + ''] === 0) {

            if ((j - 1 > 0 && metric.values[(j - 1) + ''] !== 0) && (j + 1 < daysInMonth && metric.values[(j + 1) + ''] !== 0)) {
              metric.values[j + ''] = (metric.values[(j - 1) + ''] + metric.values[(j + 1) + '']) / 2;
            } else if ((j - 1 > 0 && metric.values[(j - 1) + ''] !== 0) && (j + 1 < daysInMonth && metric.values[(j + 1) + ''] === 0)) {
              metric.values[j + ''] = metric.values[(j - 1) + ''];
            } else if ((j + 1 < daysInMonth && metric.values[(j + 1) + ''] !== 0) && (j - 1 > 0 && metric.values[(j - 1) + ''] === 0)) {
              metric.values[j + ''] = metric.values[(j + 1) + ''];
            } else if (j === 1 && (j + 1 < daysInMonth && metric.values[(j + 1) + ''] !== 0)) {
              metric.values[j + ''] = metric.values[(j + 1) + ''];
            }
          }
        }
      }
      metric.save();
    }
  });

  res.jsonp({message: 'ok'});
};
exports.flushCache = function (req, res) {
  if (redisClient) {
    redisClient.keys('cacher:*', function (err, replies) {
      if (replies.length === 0) {
        res.jsonp({msg: 'nothing to flush', code: 404});
      } else {
        redisClient.del(replies, function (err) {
          if (err) {
            res.jsonp({msg: 'flush failed', code: 500});
          } else {
            res.jsonp({
              msg: 'flushed express cache',
              count: replies.length,
              code: 200
            });
          }
        });
      }
    });
  } else {
    res.jsonp({msg: 'not connected to redis', code: 500});
  }
};
exports.preRenderFlush = function (req, res) {
  if (redisClient) {
    redisClient.keys('seo:*', function (err, replies) {
      if (replies.length === 0) {
        res.jsonp({msg: 'nothing to flush', code: 404});
      } else {
        redisClient.del(replies, function (err) {
          if (err) {
            res.jsonp({msg: 'flush failed', code: 500});
          } else {
            res.jsonp({
              msg: 'flushed seo cache',
              count: replies.length,
              code: 200
            });
          }
        });
      }
    });
  } else {
    res.jsonp({msg: 'not connected to redis', code: 500});
  }
};
