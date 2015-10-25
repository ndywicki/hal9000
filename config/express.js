'use strict';

/**
 * Module dependencies.
 */
var fs = require('fs'),
	http = require('http'),
	https = require('https'),
	express = require('express'),
	socketio = require('socket.io'),
	morgan = require('morgan'),
	logger = require('./logger'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	compression = require('compression'),
	methodOverride = require('method-override'),
	cookieParser = require('cookie-parser'),
	helmet = require('helmet'),
	passport = require('passport'),
	mongoStore = require('connect-mongo')({
		session: session
	}),
	flash = require('connect-flash'),
	config = require('./config'),
	consolidate = require('consolidate'),
	path = require('path');


module.exports = function(db) {
	// Initialize express app
	var app = express();

	// Globbing model files
	config.getGlobbedFiles('./app/models/**/*.js').forEach(function (modelPath) {
		console.log('model globbing:' + modelPath);
		require(path.resolve(modelPath));
	});

	// Setting application local variables
	app.locals.title = config.app.title;
	app.locals.description = config.app.description;
	app.locals.keywords = config.app.keywords;
	app.locals.facebookAppId = config.facebook.clientID;
	app.locals.jsFiles = config.getJavaScriptAssets();
	app.locals.cssFiles = config.getCSSAssets();

	// Passing the request url to environment locals
	app.use(function (req, res, next) {
		res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		next();
	});

	// Should be placed before express.static
	app.use(compression({
		// only compress files for the following content types
		filter: function (req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		// zlib option for compression level
		level: 3
	}));

	// Showing stack errors
	app.set('showStackError', true);

	// Set swig as the template engine
	app.engine('server.view.html', consolidate[config.templateEngine]);

	// Set views path and view engine
	app.set('view engine', 'server.view.html');
	app.set('views', './app/views');

	// Enable logger (morgan)
	app.use(morgan(logger.getLogFormat(), logger.getLogOptions()));

	// Environment dependent middleware
	if (process.env.NODE_ENV === 'development') {
		// Disable views cache
		app.set('view cache', false);
	} else if (process.env.NODE_ENV === 'production') {
		app.locals.cache = 'memory';
	}

	// Request body parsing middleware should be above methodOverride
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());
	app.use(methodOverride());

	// Use helmet to secure Express headers
	app.use(helmet.xframe());
	app.use(helmet.xssFilter());
	app.use(helmet.nosniff());
	app.use(helmet.ienoopen());
	app.disable('x-powered-by');

	// Setting the app router and static folder
	app.use(express.static(path.resolve('./public')));

	// CookieParser should be above session
	app.use(cookieParser());

	// Express MongoDB session storage
	app.use(session({
		saveUninitialized: true,
		resave: true,
		secret: config.sessionSecret,
		store: new mongoStore({
			db: db.connection.db,
			collection: config.sessionCollection
		}),
		cookie: config.sessionCookie,
		name: config.sessionName
	}));

	// use passport session
	app.use(passport.initialize());
	app.use(passport.session());

	// connect flash for flash messages
	app.use(flash());

	// Globbing routing files
	config.getGlobbedFiles('./app/routes/**/*.js').forEach(function (routePath) {
		require(path.resolve(routePath))(app);
	});

	// Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
	app.use(function (err, req, res, next) {
		// If the error object doesn't exists
		if (!err) return next();

		// Log it
		console.error(err.stack);

		// Error page
		res.status(500).render('500', {
			error: err.stack
		});
	});

	// Assume 404 since no middleware responded
	app.use(function (req, res) {
		res.status(404).render('404', {
			url: req.originalUrl,
			error: 'Not Found'
		});
	});

	if (process.env.NODE_ENV === 'secure') {
		// Load SSL key and certificate
		var privateKey = fs.readFileSync('./config/sslcerts/key.pem', 'utf8');
		var certificate = fs.readFileSync('./config/sslcerts/cert.pem', 'utf8');

		// Create HTTPS Server
		var httpsServer = https.createServer({
			key: privateKey,
			cert: certificate
		}, app);

		// Return HTTPS server instance
		return httpsServer;
	}

	// Attach Socket.io
	var server = http.createServer(app);
	var io = socketio.listen(server);
	app.set('socketio', io);
	app.set('server', server);

	// Arduino
	var Arduino = require('./../arduino/arduino');
	var arduino = new Arduino();
	arduino.on('arduino-ready', function(msg){
		console.log(msg);
	});
	io.sockets.on('connection', function (socket) {
		socket.send('connected...');
		var socketio = app.get('socketio');
		socketio.send('connected...');

		// Events from Arduino
		arduino.on('arduino-event', function(event) {
			//console.log('Event from arudino');
			socket.emit('event', event);
		});
		arduino.on('arduino-btn-down', function(event) {
			//console.log('Event from arudino');
			socket.emit('event', event);
		});
		arduino.on('arduino-sensor-hit', function(sensor) {
			//console.log('Sensor from arudino :'+sensor);
			socket.emit('sensor-hit', sensor);
		});
		arduino.on('arduino-alarm-counters-updated', function(alarm) {
			//console.log('alarm-counters-updated from arudino :'+alarm);
			socket.emit('alarm-counters-updated', alarm);
		});
        arduino.on('arduino-alarm-siren-on', function(alarm) {
            //console.log('alarm-siren-on from arudino :'+alarm);
            socket.emit('alarm-siren-on', alarm);
        });

		// Events from views
		socket.on('message', function (data) {
			if (data === 'turn on') {
				console.log('+');
				arduino.ledOn();
				socket.emit('event', 'let there be light!');
			}
			if (data === 'turn off') {
				console.log('-');
				arduino.ledOff();
				socket.emit('event', 'who turned out the light?');
			}
			return;
		});

		socket.on('alarm-status', function (status) {
			//console.log('alarm-status:'+status);
			if(status === 'complet') {
				arduino.modeComplet();
			} else if (status === 'perimetrique') {
				arduino.modePerimetrique();
			} else if (status === 'standby') {
				arduino.modeStandby();
			} else {
				console.error('Alarm status unknow:'+status);
			}

		});
		socket.on('alarm-tempo', function (value) {
			arduino.setTempo(value);
		});

		socket.on('disconnect', function () {
			socket.send('disconnected...');
		});
	});

	// Return Express server instance
	return app;
};
