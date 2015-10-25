'use strict';

(function() {
	// Events Controller Spec
	describe('EventsController', function() {
		// Initialize global variables
		var EventsController,
			scope,
			$httpBackend,
			$stateParams,
			$location;

		// The $resource service augments the response object with methods for updating and deleting the resource.
		// If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
		// the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
		// When the toEqualData matcher compares two objects, it takes only object properties into
		// account and ignores methods.
		beforeEach(function() {
			jasmine.addMatchers({
				toEqualData: function(util, customEqualityTesters) {
					return {
						compare: function(actual, expected) {
							return {
								pass: angular.equals(actual, expected)
							};
						}
					};
				}
			});
		});

		// Then we can start by loading the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
		// This allows us to inject a service but then attach it to a variable
		// with the same name as the service.
		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {
			// Set a new global scope
			scope = $rootScope.$new();

			// Point global variables to injected services
			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$location = _$location_;

			// Initialize the Events controller.
			EventsController = $controller('EventsController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one event object fetched from XHR', inject(function(Events) {
			// Create sample event using the Events service
			var sampleEvent = new Events({
				eventId: 'An Event',
				content: 'event content'
			});

			// Create a sample events array that includes the new event
			var sampleEvents = [sampleEvent];

			// Set GET response
			$httpBackend.expectGET('events').respond(sampleEvents);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.events).toEqualData(sampleEvents);
		}));
	});
}());
