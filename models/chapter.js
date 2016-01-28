var mongoose = require('mongoose');
var baseSchema = require('../libs/mongoose/baseSchema');

var ChapterSchema = baseSchema.extend({
  _id: {type: String},
  name: {type: String},
  city: {type: String},
  state: {type: String},
  country: {type: String},
  geo: {
    type: [Number],  // [<longitude>, <latitude>]
    index: '2d'      // create the geospatial index
  },
  group_type: {type: String},
  status: {type: String},
  site: {type: String},
  organizers: [{
    _id: false,
    name: {type: String},
    'gplus_url': {type: String},
    photo: {type: String}
  }]
});

mongoose.model('Chapter', ChapterSchema);
