var mongoose = require('mongoose');
var utils = require(process.cwd() + '/libs/mongoose/util');

exports.findById = utils.getModel('Chapter', {_id: 'chapterId'}, [['country', 'name']], true);
exports.list = utils.getModel('Chapter', {}, [['country', 'name']]);
exports.byCountry = utils.getModel('Chapter', {country: 'country'}, [['country', 'name']]);
exports.nearBy = function (req, res) {
  if (!req.params.lat || !req.params.lng) {
    return res.send(500, 'Please specify lat and lng');
  }
  mongoose.connection.db.executeDbCommand({
    geoNear: 'chapters',  // the mongo collection
    near: [parseFloat(req.params.lng), parseFloat(req.params.lat)], // the geo point
    spherical: true,  // tell mongo the earth is round, so it calculates based on a spherical location system
    distanceMultiplier: 6371, //6378.137,
    maxDistance: parseFloat(req.params.maxDistance) / 6371
  }, function (err, result) {
    if (err) {
      console.error(err);
      return res.send(500, 'Internal Server Error');
    }
    res.jsonp(result.documents[0].results);
  });
};
