'use strict';

/**
 * Module dependencies.
 */
var sensors = require('../../app/controllers/sensors.server.controller');

module.exports = function(app) {
	// Sensor Routes
	app.route('/sensors')
		.get(sensors.list)
		.post(sensors.create);

	app.route('/sensors/:sensorId')
		.get(sensors.read)
		.put(sensors.update)
		.delete(sensors.delete);

	// Finish by binding the sensor middleware
	app.param('sensorId', sensors.sensorByID);
};
