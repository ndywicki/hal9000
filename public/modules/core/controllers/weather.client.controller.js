'use strict';

angular.module('core').controller('WeatherController', ['$scope', 'weatherService',
	function($scope, weatherService) {
		$scope.weather = weatherService.getWeather();
	}
]);
