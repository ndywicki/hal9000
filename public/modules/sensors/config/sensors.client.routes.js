'use strict';

// Setting up route
angular.module('sensors').config(['$stateProvider',
	function($stateProvider) {
		// Sensors state routing
		$stateProvider.
		state('listSensors', {
			url: '/sensors',
			templateUrl: 'modules/sensors/views/list-sensors.client.view.html'
		}).
		state('viewSensor', {
			url: '/sensors/:sensorId',
			templateUrl: 'modules/sensors/views/view-sensor.client.view.html'
		});
	}
]);
