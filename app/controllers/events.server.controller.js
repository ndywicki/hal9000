'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	EventModel = mongoose.model('EventModel'),
	_ = require('lodash');

/**
* Create a event
*/
exports.create = function(req, res) {
	var event = new EventModel(req.body);
	//ent.user = req.user;

	event.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(event);
		}
	});
};

/**
* Show the current event
*/
exports.read = function(req, res) {
	res.json(req.event);
};

/**
* Update a event
*/
exports.update = function(req, res) {
	var event = req.event;

	event = _.extend(event, req.body);

	event.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(event);
		}
	});
};

/**
* Delete an event
*/
exports.delete = function(req, res) {
	var event = req.event;

	event.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(event);
		}
	});
};

/**
* List of Events
*/
exports.list = function(req, res) {
	EventModel.find({}).sort('-created').exec(function(err, events) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(events);
		}
	});
};

/**
 * List of Events with pagination
 */
exports.listPaginate = function(req, res) {
	var pageNumber = req.params.pageNumber;
	var nPerPage = req.params.nPerPage;
	EventModel.find({}).skip(pageNumber > 0 ? ((pageNumber-1)*nPerPage) : 0).limit(nPerPage).sort('-created').exec(function(err, events) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(events);
		}
	});
};


/**
 * Count the total event
 */
exports.count = function(req, res) {
	console.log('count entered');
	EventModel.count({}, function (err, count) {
		console.log('count'+count);
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(count);
		}
	});
};


/**
* Event middleware
*/
exports.eventByID = function(req, res, next, id) {

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).send({
			message: 'Event is invalid'
		});
	}

	EventModel.findById(id).exec(function(err, event) {
		if (err) return next(err);
		if (!event) {
			return res.status(404).send({
  				message: 'Event not found'
  			});
		}
		req.event = event;
		next();
	});
};

/**
 * Event authorization middleware
 */
// exports.hasAuthorization = function(req, res, next) {
	// if (req.event.user.id !== req.user.id) {
		// return res.status(403).send({
			// message: 'User is not authorized'
		// });
	// }
	// next();
// };
