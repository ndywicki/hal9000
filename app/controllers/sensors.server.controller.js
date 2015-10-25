'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	SensorModel = mongoose.model('SensorModel'),
	_ = require('lodash');

/**
* Create a sensor
*/
exports.create = function(req, res) {
	var sensor = new SensorModel(req.body);
	//ent.user = req.user;

	sensor.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(sensor);
		}
	});
};

/**
* Show the current sensor
*/
exports.read = function(req, res) {
	res.json(req.sensor);
};

/**
* Update a sensor
*/
exports.update = function(req, res) {
	var sensor = req.sensor;

	sensor = _.extend(sensor, req.body);

	sensor.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(sensor);
		}
	});
};

/**
* Delete an sensor
*/
exports.delete = function(req, res) {
	var sensor = req.sensor;

	sensor.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(sensor);
		}
	});
};

/**
* List of Sensors
*/
exports.list = function(req, res) {
	SensorModel.find({}).sort('-created').exec(function(err, sensors) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(sensors);
		}
	});
};

/**
* Sensor middleware
*/
exports.sensorByID = function(req, res, next, id) {

	//if (!mongoose.Types.ObjectId.isValid(id)) {
	//	return res.status(400).send({
	//		message: 'Sensor is invalid'
	//	});
	//}
    //
	//SensorModel.findById(id).exec(function(err, sensor) {
	//	if (err) return next(err);
	//	if (!sensor) {
	//		return res.status(404).send({
  	//			message: 'Sensor not found'
  	//		});
	//	}
	//	req.sensor = sensor;
	//	next();
	//});
	SensorModel.find({ 'id': id}).exec(function(err, sensor) {
		if (err) return next(err);
		if (!sensor) {
			return res.status(404).send({
				message: 'Sensor not found'
			});
		}
		req.sensor = sensor[0];
		next();
	});
};

/**
 * Sensor authorization middleware
 */
// exports.hasAuthorization = function(req, res, next) {
	// if (req.sensor.user.id !== req.user.id) {
		// return res.status(403).send({
			// message: 'User is not authorized'
		// });
	// }
	// next();
// };
