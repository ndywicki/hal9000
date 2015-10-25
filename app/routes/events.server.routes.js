'use strict';

/**
 * Module dependencies.
 */
var events = require('../../app/controllers/events.server.controller');

module.exports = function(app) {
	// Event Routes
	app.route('/events')
		.get(events.list)
		.post(events.create);

	app.route('/events/count')
		.get(events.count);

	app.route('/events/:eventId')
		.get(events.read)
		.put(events.update)
		.delete(events.delete);

	app.route('/events/pageNumber/:pageNumber/nPerPage/:nPerPage')
		.get(events.listPaginate);


	// Finish by binding the event middleware
	app.param('eventId', events.eventByID);
};
