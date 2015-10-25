'use strict';

/**
 * Module dependencies.
 */
var alerts = require('../../app/controllers/alert.server.controller');

module.exports = function(app) {
	// Alarm Routes
	app.route('/alert/:message')
		.get(alerts.sent);
};
