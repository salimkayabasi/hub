var data = require('./documentation-data.json');
exports.index = function (req, res, next) {
  next(data);
};
