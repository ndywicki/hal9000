'use strict';

//Sensors service used for communicating with the sensors REST endpoints
angular.module('sensors').factory('Sensors', ['$resource',
	function($resource) {
		return $resource('sensors/:sensorId', {
			sensorId: '@id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
