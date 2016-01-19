var mongoose = require('mongoose');
var Chapter = mongoose.model('Chapter');

exports.findById = function (req, res) {
  Chapter.find({organizers: req.params.gplusId}, function (err, chapters) {
      if (err) {
        return next(err);
      }
      var response = {
        user: req.params.gplusId,
        chapters: []
      };
      for (var i = 0; i < chapters.length; i++) {
        response.chapters.push({id: chapters[i]._id, name: chapters[i].name});
      }
      return res.jsonp(response);
    }
  );
};
