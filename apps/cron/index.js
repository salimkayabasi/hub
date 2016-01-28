var cron = require('cron');
var config = require('config');
var tasksPath = process.cwd() + '/apps/cron/tasks';
var tasks = require('../../libs/controller/')(tasksPath);
var log = require('../../libs/log/')(module);

var newCron = function (task, cronTime) {
  new cron.CronJob({
    cronTime: cronTime,
    onTick: task.run,
    start: config.app.cron.autoStart
  }).start();
};

exports.init = function (cb) {
  if (config.app.cron.enabled) {
    log.info('Cron app started');
    newCron(tasks.gde, config.app.cron.dailyTime);
    newCron(tasks.chapter, config.app.cron.dailyTime);
  }
  if (cb) {
    cb();
  }
};
