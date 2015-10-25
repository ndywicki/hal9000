'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	AlarmModel = mongoose.model('AlarmModel'),
	_ = require('lodash');


/**
* Show the current alarm
*/
exports.read = function(req, res) {
	res.json(req.alarm);
};

/**
* Get alarm
*/
exports.get = function(req, res) {
	AlarmModel.find({}).exec(function(err, alarm) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(alarm[0]);
		}
	});
};
