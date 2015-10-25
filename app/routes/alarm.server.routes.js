'use strict';

/**
 * Module dependencies.
 */
var alarm = require('../../app/controllers/alarm.server.controller');

module.exports = function(app) {
	// Alarm Routes
	app.route('/alarm')
		.get(alarm.get);
};
