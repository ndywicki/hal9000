'use strict';

angular.module('sensors').controller('SensorsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Sensors',
	function($scope, $stateParams, $location, Authentication, Sensors) {
		$scope.authentication = Authentication;

		$scope.create = function() {
			var sensor = new Sensors({
				id: this.id,
				description: this.description
			});
			sensor.$save(function(response) {
				$location.path('sensors/' + response.id);

				$scope.id = '';
				$scope.description = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.remove = function(sensor) {
			if (sensor) {
				sensor.$remove();

				for (var i in $scope.sensors) {
					if ($scope.sensors[i] === sensor) {
						$scope.sensors.splice(i, 1);
					}
				}
			} else {
				$scope.sensor.$remove(function() {
					$location.path('sensors');
				});
			}
		};

		$scope.update = function() {
			var sensor = $scope.sensor;

			sensor.$update(function() {
				$location.path('sensors/' + sensor.id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.find = function() {
			$scope.sensors = Sensors.query();
		};

		$scope.findOne = function() {
			$scope.sensor = Sensors.get({
				sensorId: $stateParams.sensorId
			});
		};
	}
]);
