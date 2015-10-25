'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Event Schema
 */
var EventSchema = new Schema({
	created: {
		type: Date,
		default: Date.now
	},
	eventId: {
		type: String,
		default: '',
		trim: true,
		required: 'Event id cannot be blank'
	},
	content: {
		type: String,
		default: '',
		trim: true
	}
});

mongoose.model('EventModel', EventSchema);