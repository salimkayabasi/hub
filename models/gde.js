var mongoose = require('mongoose');
var baseSchema = require('../libs/mongoose/baseSchema');

var GdeSchema = baseSchema.extend({
  name: {type: String, trim: true},
  img: {type: String, trim: true},
  location: {type: String, trim: true},
  role: {type: String, trim: true},
  skills: {type: String, trim: true},
  url: {type: String, trim: true}
});
mongoose.model('Gde', GdeSchema);
