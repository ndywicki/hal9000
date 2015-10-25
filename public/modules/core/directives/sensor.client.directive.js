'use strict';

angular.module('core').directive('ngSensor', ['Sensors','Socket',
	function(Sensors, Socket) {
		return {
			scope: {
				id: '@'
			},
			templateUrl: 'modules/core/views/partials/_sensor.html',
			restrict: 'E',
			replace: true,
			controller: function($scope){
				Socket.on('sensor-hit', function(sensor) {
					// It's me ?
					if(sensor.id === $scope.id) {
						$scope.switchSensorClass(sensor.active);
					}
				});
			},
			link: function($scope, element, attrs) {
				$scope.switchSensorClass = function(active) {
					if(active) {
						$scope.sensorClass = 'btn-danger';
					} else {
						$scope.sensorClass = 'btn-default';
					}
				};
				//init first display
				$scope.sensor = Sensors.get(
					{ sensorId: $scope.id },
					function(sensor){
						$scope.switchSensorClass(sensor.active);
					}
				);
			}
		};
	}
]);
