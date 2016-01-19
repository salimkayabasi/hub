var config = require('config');
var express = require('express');
var ensureUser = require('connect-ensure-login');
var ensureLoggedIn = ensureUser.ensureLoggedIn;
var ensureNotLoggedIn = ensureUser.ensureNotLoggedIn;

var apiV1PreFix = config.app.api.apiV1PreFix;
var apiV2PreFix = config.app.api.apiV2PreFix;

var controller = require('./controller');

exports.init = function (app) {

  var apiV1 = express.Router();
  var apiV2 = express.Router();


  app.use(apiV1PreFix, apiV1);
  var chapters = express.Router();
  chapters.route('/').get(controller.v1.chapters.list);
  chapters.route('/country/:country').get(controller.v1.chapters.byCountry);
  chapters.route('/near/:lat/:lng/:maxDistance').get(controller.v1.chapters.nearBy);
  chapters.route('/:chapterId').get(controller.v1.chapters.findById);
  apiV1.use('/chapters', chapters);

  var chapter = express.Router();
  chapter.route('/').get(controller.v2.chapter.list);
  chapter.route('/:id').get(controller.v2.chapter.findById);
  apiV2.use('/chapter', chapter);


  app.use(apiV1PreFix, apiV1);
  app.use(apiV2PreFix, apiV2);

  var router = express.Router();
  router.route('/partials/*').get(controller.web.partials);
  router.route('/directives/*').get(controller.web.partials);
  router.route('*').get(controller.web.home);
  app.use(router);
};
