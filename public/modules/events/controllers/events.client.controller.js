'use strict';

angular.module('events').controller('EventsController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Events', 'Socket', 'ngTableParams',
	function($scope, $http, $stateParams, $location, Authentication, Events, Socket, NgTableParams) {
		$scope.authentication = Authentication;

		// Events table
		$scope.tableEvents = new NgTableParams({
			page: 1, 	// Page number
			count: 10,  // Count per page
			sorting: {
				created: 'asc'     // initial sorting
			}
		}, {
			getData: function($defer, params) {
				var total;
				$http.get('/events/count/')
				.success(function(count) {
					total = count;
				}).error(function(response) {
					$scope.error = response.message;
				});
				//console.log('getData params.page():'+params.page()+ ' count:'+params.count());
				$http.get('/events/pageNumber/'+params.page()+'/nPerPage/'+params.count(),
					{headers: { 'Content-Type': 'application/json'}})
				.success(function(events) {
						$scope.events = events;
						params.total(total);
						$defer.resolve(events);
				}).error(function(response) {
						$scope.error = response.message;
				});

			}
		});

		Socket.on('event', function(event) {
			console.log('EventsController event:'+event);
			//events.push(event);
			//$scope.events.push(event);
			$scope.tableEvents.reload();
		});

	}
]);
