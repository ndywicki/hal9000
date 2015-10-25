'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Alarm Schema
 */
var AlarmSchema = new Schema({
	_id: Number,
	status: {
		type: String,
		enum: ['complet', 'perimetrique', 'standby'],
		default: 'standby',
		trim: true,
		required: 'Status cannot be blank'
	},
	alertes: {
		type: Number,
		default: '0'
	},
	actions: {
		type: Number,
		default: '0'
	},
	tempo: {
		type: Number,
		default: '30'
	},
	siren: {
		type: Boolean,
		default: false
	}
});

mongoose.model('AlarmModel', AlarmSchema);
