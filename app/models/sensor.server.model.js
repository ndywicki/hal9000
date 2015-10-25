'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Sensor Schema
 */
var SensorSchema = new Schema({
	id: {
		type: String,
		default: '',
		trim: true,
		required: 'Sensor id cannot be blank',
		index: { unique: true, dropDups: true }
	},
	type: {
		type: String,
		default: '',
		trim: true
	},
	description: {
		type: String,
		default: '',
		trim: true
	},
	active: {
		type: Boolean,
		default: false
	}
});

mongoose.model('SensorModel', SensorSchema);
