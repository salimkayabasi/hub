var utils = require(process.cwd() + '/libs/mongoose/util');

exports.findById = utils.getModel('Tag', {_id: 'tagId'}, null, true);
exports.list = utils.getModel('Tag', {});
