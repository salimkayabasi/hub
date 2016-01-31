var async = require('async');
var config = require('config');
var express = require('express');
var app = express();

var log = require('../libs/log/index')(module);
var expressUtil = require('../libs/express/index');
var passportUtil = require('../libs/passport/index');

exports.init = function (cb) {
  async.seq(
    passportUtil.init,
    expressUtil.init.bind(null, app),
    app.listen.bind(app, config.app.api.port)
  )(function () {
    log.info('API is started at port:', config.app.api.port);
    if (cb) {
      cb(app);
    }
  });
};
