var controllersPath = process.cwd() + '/app/controllers';
var apiPath = process.cwd() + '/app/controllers/api/';

var controllerUtil = require('../controller/controller');

var controller = controllerUtil(controllersPath);
controller.v1 = controllerUtil(apiPath + '/v1');
controller.v2 = controllerUtil(apiPath + '/2');

module.exports = exports = controller;
