var config = require('config');
var express = require('express');
var middleware = require('./middleware');

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
  chapters.route('/:chapterId/events').get(controller.v1.chapter.events);
  chapters.route('/:chapterId/events/upcoming').get(controller.v1.chapter.eventsUpcoming);
  chapters.route('/:chapterId/events/past').get(controller.v1.chapter.eventsPast);
  chapters.route('/:chapterId/events/month').get(controller.v1.chapter.eventsThisMonth);
  chapters.route('/:chapterId/events/year/:year/:month').get(controller.v1.chapter.eventsByMonth);
  chapters.route('/:chapterId/events/:start/:end').get(controller.v1.chapter.eventsByDate);
  chapters.route('/:chapterId/events/tag/:tag').get(controller.v1.chapter.eventsByTag);
  chapters.route('/:chapterId/events/stats').get(controller.v1.chapter.eventsByStats);
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
  //region Events
  var events = express.Router();
  events.route('/').get(controller.v1.event.list);
  events.route('/past').get(controller.v1.event.past);
  events.route('/upcoming').get(controller.v1.event.upcoming);
  events.route('/upcoming').get(controller.v1.event.upcoming);
  events.route('/today').get(controller.v1.event.today);
  events.route('/now').get(controller.v1.event.now);
  events.route('/stats').get(controller.v1.event.byStats);
  events.route('/:eventId/near').get(controller.v1.event.nearByEventsOfEvent);
  events.route('/near/:lat/:lng/:maxDistance').get(controller.v1.event.nearByEvents);
  events.route('/year/:year').get(controller.v1.event.byYear);
  events.route('/year/:year/:month').get(controller.v1.event.byMonth);
  events.route('/tags').get(controller.v1.event.tags);
  events.route('/tag/:tag').get(controller.v1.event.byTag);
  events.route('/tag/:tag/upcoming').get(controller.v1.event.byTagUpcoming);
  events.route('/tag/:tag/:start/:end').get(controller.v1.event.byTagDate);
  events.route('/:start/:end').get(controller.v1.event.byDate);
  events.route('/:eventId').get(controller.v1.event.fidnById);
  apiV1.use('/events', events);
  //endregion
  //region Applications
  var apps = express.Router();
  apps.route('/')
    .get(middleware.auth(), controller.v1.application.list)
    .post(middleware.auth(), controller.v1.application.insert);
  apps.route('/:applicationId')
    .get(middleware.auth(), controller.v1.application.findById)
    .delete(middleware.auth(), controller.v1.application.remove);
  apps.route('/:applicationId/simpleapikeys')
    .get(middleware.auth(), controller.v1.application.listKeys)
    .post(middleware.auth(), controller.v1.application.addKey);
  apps.route('/:applicationId/consumers')
    .get(middleware.auth(), controller.v1.application.listConsumers)
    .post(middleware.auth(), controller.v1.application.addConsumer);
  apiV1.use('/applications', apps);
  //endregion
  //region Frisbee
  var frisbeeApp = express.Router();
  frisbeeApp.route('/user/home')
    .put(middleware.frisbee, controller.v1.frisbee.setHome);
  frisbeeApp.route('/gcm/register')
    .post(middleware.frisbee, controller.v1.frisbee.gcmRegister);
  frisbeeApp.route('/gcm/unregister')
    .post(middleware.frisbee, controller.v1.frisbee.gcmUnregister);
  apiV1.use('/frisbee', frisbeeApp);
  //endregion
  //region Admin
  var admins = express.Router();
  admins.route('/tasks')
    .post(middleware.isAdmin, controller.v1.admin.runTasks);
  admins.route('/tasks/cluster')
    .post(middleware.isAdmin, controller.v1.admin.getCluster);
  admins.route('/metrics/fix')
    .post(middleware.isAdmin, controller.v1.admin.fixMetrics);
  admins.route('/cache/flush')
    .post(middleware.isAdmin, controller.v1.admin.flushCache);
  admins.route('/prerender/flush')
    .post(middleware.isAdmin, controller.v1.admin.preRenderFlush);
  apiV1.use('/admin', admins);
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
  router.route('/signin').post(controller.auth.signin);
  router.route('*').get(controller.web.home);
  //endregion

  app.use(apiV1PreFix, apiV1);
  app.use(apiV2PreFix, apiV2);
  app.use(router);
};
