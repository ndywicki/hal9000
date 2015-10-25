'use strict';

angular.module('core').directive('weatherIcon', [
	function() {
		return {
			restrict: 'E', replace: true,
			scope: {
				icon: '@'
			},
			controller: function($scope) {
				$scope.imgurl = function() {
					return 'http://openweathermap.org/img/w/' + $scope.icon + '.png';
					//if ($scope.cloudiness < 20) {
					//	return baseUrl + 'sunny.png';
					//} else if ($scope.cloudiness < 90) {
					//	return baseUrl + 'partly_cloudy.png';
					//} else {
					//	return baseUrl + 'cloudy.png';
					//}
				};
				$scope.weatherClass = function() {
					if ($scope.icon === '01d') {
						return 'wi-day-sunny';
					} else if ($scope.icon === '02d') {
						return 'wi-day-cloudy';
					} else if ($scope.icon === '03d') {
						return 'wi-cloud';
					} else if ($scope.icon === '04d') {
						return 'wi-cloudy';
					} else if ($scope.icon === '09d') {
						return 'wi-rain';
					} else if ($scope.icon === '10d') {
						return 'wi-day-rain';
					} else if ($scope.icon === '11d') {
						return 'wi-day-thunderstorm';
					} else if ($scope.icon === '13d') {
						return 'wi-snow';
					} else if ($scope.icon === '50d') {
						return 'wi-day-fog';
					} else if ($scope.icon === '01n') {
						return 'wi-night-clear';
					} else if ($scope.icon === '02n') {
						return 'wi-night-alt-cloudy';
					} else if ($scope.icon === '03n') {
						return 'wi-cloud';
					} else if ($scope.icon === '04n') {
						return 'wi-cloudy';
					} else if ($scope.icon === '09n') {
						return 'wi-rain';
					} else if ($scope.icon === '10n') {
						return 'wi-night-alt-sprinkle';
					} else if ($scope.icon === '11n') {
						return 'wi-night-thunderstorm';
					} else if ($scope.icon === '13n') {
						return 'wi-snow';
					} else if ($scope.icon === '50n') {
						return 'wi-day-fog';
					}
				};
			},
			//template: '<div style="float:left;"><img ng-src="{{ imgurl() }}"></div>'
			template: '<div style="float:left;" class="wi {{ weatherClass() }} weatherIcon"/>'
		};
	}
]);
