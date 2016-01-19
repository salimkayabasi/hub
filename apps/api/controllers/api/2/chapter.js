var mongoose = require('mongoose');
var Chapter = mongoose.model('Chapter');
var mongooseUtil = require(process.cwd() + '/libs/mongoose/');
var utils = require(process.cwd() + '/libs/mongoose/util');

exports.list = function (req, res, next) {
  mongooseUtil.paging(Chapter, req, res, next);
};
exports.findById = function (req, res, next) {
  mongooseUtil.findById(Chapter, req, res, next);
};


