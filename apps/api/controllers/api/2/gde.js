var mongoose = require('mongoose');
var GDE = mongoose.model('Gde');
var mongooseUtil = require(process.cwd() + '/libs/mongoose/');
var utils = require(process.cwd() + '/libs/mongoose/util');

exports.list = function (req, res, next) {
  mongooseUtil.paging(GDE, req, res, next);
};
exports.findById = function (req, res, next) {
  mongooseUtil.findById(GDE, req, res, next);
};


