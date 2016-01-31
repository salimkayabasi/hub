var config = require('config');
var log = require('./libs/log/')(module);
var mongooseUtil = require('./libs/mongoose/');

var server = function (done) {
  mongooseUtil.init(function () {
    require('./cron')
      .init(function (app) {
        if (done) {
          done(null, app);
        }
      });
  });
};

if (require.main === module) {
  log.info('cron app is started in standalone mode');
  server();
} else {
  log.info('cron app is started for testing');
  module.exports = server;
}

if (config.status === 'prod') {
  process.on('uncaughtException', function (err) {
    //noinspection JSCheckFunctionSignatures
    log.error(JSON.parse(
      JSON.stringify(err, ['stack', 'message', 'inner'], 3)));
  });
}
