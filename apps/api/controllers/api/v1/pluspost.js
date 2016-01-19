var utils = require(process.cwd() + '/libs/mongoose/util');

exports.byTag = utils.getModel('PlusPost', {hashtags: 'hashtags'});
