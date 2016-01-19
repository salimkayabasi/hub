var config = require('config');
var express = require('express');
var ensureUser = require('connect-ensure-login');
var ensureLoggedIn = ensureUser.ensureLoggedIn;
var ensureNotLoggedIn = ensureUser.ensureNotLoggedIn;

var apiV1PreFix = config.app.api.apiV1PreFix;
var apiV2PreFix = config.app.api.apiV2PreFix;

var controller = require('./controller');

exports.init = function (app) {

  //routers
  var apiV1 = express.Router();
  var apiV2 = express.Router();
  var router = express.Router();

  //region API v1
  //region Chapters
  var chapters = express.Router();
  chapters.route('/').get(controller.v1.chapter.list);
  chapters.route('/country/:country').get(controller.v1.chapter.byCountry);
  chapters.route('/:chapterId/posts').get(controller.v1.chapter.posts);
  chapters.route('/chapters/:chapterId/posts/:hashtags').get(controller.v1.chapter.postsByTag);
  chapters.route('/near/:lat/:lng/:maxDistance').get(controller.v1.chapter.nearBy);
  chapters.route('/:chapterId').get(controller.v1.chapter.findById);
  apiV1.use('/chapters', chapters);
  //endregion
  //region GDE
  var gdes = express.Router();
  gdes.route('/').get(controller.v1.gde.list);
  gdes.route('/products').get(controller.v1.gde.products);
  gdes.route('/product/:productCode').get(controller.v1.gde.productsByCode);
  gdes.route('/country/:country').get(controller.v1.gde.byCountry);
  gdes.route('/:gdeId').get(controller.v1.gde.findById);
  apiV1.use('/gdes', gdes);
  //endregion
  // region PlusPosts
  var posts = express.Router();
  posts.route('/hashtag/:hashtags').get(controller.v1.pluspost.byTag);
  apiV1.use('/plus/posts', posts);
  //endregion
  // region Tags
  var tags = express.Router();
  tags.route('/').get(controller.v1.tag.list);
  tags.route('/tagId').get(controller.v1.tag.findById);
  apiV1.use('/tags', tags);
  //endregion
  //region Documentation
  var doc = express.Router();
  doc.route('/').get(controller.v1.documentation.index);
  apiV1.use('/rest', doc);
  //endregion
  //region Organizer
  var organizers = express.Router();
  organizers.route('/:gplusId').get(controller.v1.organizer.findById);
  apiV1.use('/organizer', organizers);
  //endregion
  //region Metrics
  var metrics = express.Router();
  metrics.route('/types').get(controller.v1.metric.byType);
  metrics.route('/daily/:subject/:metric/:year/:month').get(controller.v1.metric.daily);
  apiV1.use('/metrics', metrics);
  //endregion
  //endregion

  //region API 2
  //region Chapter
  var chapter = express.Router();
  chapter.route('/').get(controller.v2.chapter.list);
  chapter.route('/:id').get(controller.v2.chapter.findById);
  apiV2.use('/chapter', chapter);
  //endregion
  //endregion

  //region Web UI
  router.route('/partials/*').get(controller.web.partials);
  router.route('/directives/*').get(controller.web.partials);
  router.route('*').get(controller.web.home);
  //endregion

  app.use(apiV1PreFix, apiV1);
  app.use(apiV2PreFix, apiV2);
  app.use(router);
};
