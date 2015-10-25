'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'mean';
	var applicationModuleVendorDependencies = ['toggle-switch', 'btford.socket-io', 'ngResource', 'ngAnimate', 'ngTable', 'ui.router', 'ui.bootstrap', 'ui.utils'];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();

'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.hashPrefix('!');
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('core');

'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('events');

'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('sensors');

'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('users');
'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');

		// Home state routing
		$stateProvider.
		state('home', {
			url: '/',
			templateUrl: 'modules/core/views/home.client.view.html'
		});
	}
]);

'use strict';

angular.module('core').controller('HeaderController', ['$scope', 'Authentication', 'Menus',
	function($scope, Authentication, Menus) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
]);
'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'Socket', 'Sensors', 'Alarm', 'Alert',
	function($scope, Authentication, Socket, Sensors, Alarm, Alert) {
		// This provides Authentication context.
		$scope.authentication = Authentication;

        //function to change css class
        function switchalarmStatusClass(alarm) {
            $scope.alarmStatus = alarm.status;
            if(alarm.siren) {
                $scope.alarmStatus = '!! Siren !!';
                $scope.alarmStatusClass = 'btn-danger';
            } else  if(alarm.status === 'complet') {
                $scope.alarmStatusClass = 'btn-success';
            } else if (alarm.status === 'perimetrique'){
                $scope.alarmStatusClass = 'btn-warning';
            } else {
                $scope.alarmStatusClass = 'btn-default';
            }
        }

        //function update alarm ng-model
        function updateAlarm(alarm) {
            //console.log('alarm:'+alarm.status+'siren:'+alarm.siren);
            $scope.alarmStatus = alarm.status;
            switchalarmStatusClass(alarm);
            $scope.alertesCount = alarm.alertes;
            $scope.actionsCount = alarm.actions;
            $scope.alarmTempo = alarm.tempo;
        }

        //init
        //Load sensors
        $scope.sensors = Sensors.query();
        //init ng-model alarm
        Alarm.get(function(alarm) {
            updateAlarm(alarm);
        });

        //Action from ng-button
		$scope.changeAlarmStatus = function (status) {
			Socket.emit('alarm-status', status);
			Alarm.get(function(alarm) {
				updateAlarm(alarm);
			});
		};

        $scope.$watch('alarmTempo', function (newValue, oldvalue) {
            if(!isEmpty(newValue) && newValue !== oldvalue) {
                Socket.emit('alarm-tempo', newValue);
            }
        });

        //Event from express.js
		Socket.on('alarm-counters-updated', function(alarm) {
			switchalarmStatusClass(alarm);
			$scope.alertesCount = alarm.alertes;
			$scope.actionsCount = alarm.actions;
			$scope.$apply();
		});

        Socket.on('alarm-siren-on', function(alarm) {
            switchalarmStatusClass(alarm);
            Alert.sent({message: 'Alarm%20intrusion!'});
            $scope.$apply();
        });

        function isEmpty(value) {
            return angular.isUndefined(value) || value === '' || value === null || value !== value;
        }
	}
]);

'use strict';

angular.module('core').controller('WeatherController', ['$scope', 'weatherService',
	function($scope, weatherService) {
		$scope.weather = weatherService.getWeather();
	}
]);

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
			controller: ["$scope", function($scope){
				Socket.on('sensor-hit', function(sensor) {
					// It's me ?
					if(sensor.id === $scope.id) {
						$scope.switchSensorClass(sensor.active);
					}
				});
			}],
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

'use strict';

angular.module('core').directive('weatherIcon', [
	function() {
		return {
			restrict: 'E', replace: true,
			scope: {
				icon: '@'
			},
			controller: ["$scope", function($scope) {
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
			}],
			//template: '<div style="float:left;"><img ng-src="{{ imgurl() }}"></div>'
			template: '<div style="float:left;" class="wi {{ weatherClass() }} weatherIcon"/>'
		};
	}
]);

'use strict';

angular.module('core').filter('temperature', ['$filter',
	function($filter) {
		return function(input, precision) {
			if (!precision) {
				precision = 1;
			}
			var numberFilter = $filter('number');
			return numberFilter(input, precision) + '\u00B0C';
		};
	}
]);

'use strict';

//Sensor service used for communicating with the sensors REST endpoints
angular.module('core').factory('Alarm', ['$resource',
    function($resource) {
        return $resource('alarm');
    }
]);

'use strict';

//Sensor service used for communicating with the sensors REST endpoints
angular.module('core').factory('Alert', ['$resource',
    function($resource) {
        return $resource(
            'alert/:message', {message: '@message'},
            {sent: { method: 'GET', isArray: false }}
        );
    }
]);

//'use strict';
//
////Events service used for communicating with the events REST endpoints
//angular.module('core').factory('Events', ['$resource',
//    function($resource) {
//        return $resource('events/:eventId', {
//            eventId: '@_id'
//        }, {
//            update: {
//                method: 'PUT'
//            }
//        });
//    }
//]);

'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [

	function() {
		// Define a set of default roles
		this.defaultRoles = ['*'];

		// Define the menus object
		this.menus = {};

		// A private function for rendering decision 
		var shouldRender = function(user) {
			if (user) {
				if (!!~this.roles.indexOf('*')) {
					return true;
				} else {
					for (var userRoleIndex in user.roles) {
						for (var roleIndex in this.roles) {
							if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
								return true;
							}
						}
					}
				}
			} else {
				return this.isPublic;
			}

			return false;
		};

		// Validate menu existance
		this.validateMenuExistance = function(menuId) {
			if (menuId && menuId.length) {
				if (this.menus[menuId]) {
					return true;
				} else {
					throw new Error('Menu does not exists');
				}
			} else {
				throw new Error('MenuId was not provided');
			}

			return false;
		};

		// Get the menu object by menu id
		this.getMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			return this.menus[menuId];
		};

		// Add new menu object by menu id
		this.addMenu = function(menuId, isPublic, roles) {
			// Create the new menu
			this.menus[menuId] = {
				isPublic: isPublic || false,
				roles: roles || this.defaultRoles,
				items: [],
				shouldRender: shouldRender
			};

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			delete this.menus[menuId];
		};

		// Add menu item object
		this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Push new menu item
			this.menus[menuId].items.push({
				title: menuItemTitle,
				link: menuItemURL,
				menuItemType: menuItemType || 'item',
				menuItemClass: menuItemType,
				uiRoute: menuItemUIRoute || ('/' + menuItemURL),
				isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
				roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
				position: position || 0,
				items: [],
				shouldRender: shouldRender
			});

			// Return the menu object
			return this.menus[menuId];
		};

		// Add submenu item object
		this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
					// Push new submenu item
					this.menus[menuId].items[itemIndex].items.push({
						title: menuItemTitle,
						link: menuItemURL,
						uiRoute: menuItemUIRoute || ('/' + menuItemURL),
						isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
						roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
						position: position || 0,
						shouldRender: shouldRender
					});
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenuItem = function(menuId, menuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
					this.menus[menuId].items.splice(itemIndex, 1);
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeSubMenuItem = function(menuId, submenuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
					if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
						this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
					}
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		//Adding the topbar menu
		this.addMenu('topbar');
	}
]);
'use strict';

//Sensor service used for communicating with the sensors REST endpoints
angular.module('core').factory('Sensors', ['$resource',
    function($resource) {
        return $resource('sensors/:sensorId', {
            sensorId: '@_id'
        });
    }
]);

'use strict';

angular.module('core').factory('smsApiService', ["$http", "Alert", function($http, Alert) {
    return {
        sentSms: function() {
            //var apiUrl = 'https://smsapi.free-mobile.fr/sendmsg?user=12756681&pass=iksR4TyKJMxksy&msg=Alarm%20intrusion!';
            //process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            console.log('smsApiService sent SMS...');
            Alert.sent();
            //var request = $http({
            //    method: "get",
            //    url: "api/index.cfm",
            //    params: {
            //        action: "get"
            //    }
            //});


            //$http.get(apiUrl, function(res) {
            //    if(res !== 200){
            //        // Envoi depuis le Sim900, mail, etc.
            //        alert('todo email');
            //    }
            //
            //    res.resume();
            ////}).on('error', function(e) {
            ////    console.error(e);
            //});
        }
    };
}]);

'use strict';
/*global io:false */

//socket factory that provides the socket service
angular.module('core').factory('Socket', ['socketFactory', '$location',
    function(socketFactory, $location) {
        console.log('socketFactory '+$location.host()+' port:'+$location.port());
        return socketFactory({
            prefix: '',
            ioSocket: io.connect( $location.protocol() + '://' + $location.host() + ':' + $location.port() )
        });
    }
]);

'use strict';

angular.module('core').factory('weatherService', ["$http", function($http) {
    return {
        getWeather: function() {
            var weather = { name: {}, weather: {}, temp: {}, clouds: null };
            var url = 'http://api.openweathermap.org/data/2.5/weather?q=Pontoise,Fr&units=metric&callback=JSON_CALLBACK&lang=fr';
            $http.jsonp(url).success(function(data) {
                if (data) {
                    if (data.main) {
                        weather.name = data.name;
                        weather.icon = data.weather[0].icon;
                        weather.desciption = data.weather[0].description;
                        weather.temp.current = data.main.temp;
                        weather.temp.min = data.main.temp_min;
                        weather.temp.max = data.main.temp_max;
                    }
                    weather.clouds = data.clouds ? data.clouds.all : undefined;
                }
            });

            return weather;
        }
    };
}]);

'use strict';

// Configuring the Events module
angular.module('events').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Events', 'events', 'dropdown', '/events(/create)?');
		Menus.addSubMenuItem('topbar', 'events', 'List Events', 'events');
		//Menus.addSubMenuItem('topbar', 'events', 'New Event', 'events/create');
	}
]);

'use strict';

// Setting up route
angular.module('events').config(['$stateProvider',
	function($stateProvider) {
		// Events state routing
		$stateProvider.
		state('listEvents', {
			url: '/events',
			templateUrl: 'modules/events/views/list-events.client.view.html'
		});
	}
]);

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

'use strict';

//Events service used for communicating with the events REST endpoints
angular.module('events').factory('Events', ['$resource',
	function($resource) {
		return $resource('events/:eventId', {
			eventId: '@_id'
		});
	}
]);

'use strict';

// Configuring the Sensors module
angular.module('sensors').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Sensors', 'sensors', 'dropdown', '/sensors(/create)?');
		Menus.addSubMenuItem('topbar', 'sensors', 'List Sensors', 'sensors');
	}
]);

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

'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
	function($httpProvider) {
		// Set the httpProvider "not authorized" interceptor
		$httpProvider.interceptors.push(['$q', '$location', 'Authentication',
			function($q, $location, Authentication) {
				return {
					responseError: function(rejection) {
						switch (rejection.status) {
							case 401:
								// Deauthenticate the global user
								Authentication.user = null;

								// Redirect to signin page
								$location.path('signin');
								break;
							case 403:
								// Add unauthorized behaviour 
								break;
						}

						return $q.reject(rejection);
					}
				};
			}
		]);
	}
]);
'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
	function($stateProvider) {
		// Users state routing
		$stateProvider.
		state('profile', {
			url: '/settings/profile',
			templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
		}).
		state('password', {
			url: '/settings/password',
			templateUrl: 'modules/users/views/settings/change-password.client.view.html'
		}).
		state('accounts', {
			url: '/settings/accounts',
			templateUrl: 'modules/users/views/settings/social-accounts.client.view.html'
		}).
		state('signup', {
			url: '/signup',
			templateUrl: 'modules/users/views/authentication/signup.client.view.html'
		}).
		state('signin', {
			url: '/signin',
			templateUrl: 'modules/users/views/authentication/signin.client.view.html'
		}).
		state('forgot', {
			url: '/password/forgot',
			templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
		}).
		state('reset-invalid', {
			url: '/password/reset/invalid',
			templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
		}).
		state('reset-success', {
			url: '/password/reset/success',
			templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
		}).
		state('reset', {
			url: '/password/reset/:token',
			templateUrl: 'modules/users/views/password/reset-password.client.view.html'
		});
	}
]);
'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
	function($scope, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		$scope.signup = function() {
			$http.post('/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		$scope.signin = function() {
			$http.post('/auth/signin', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
	function($scope, $stateParams, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		//If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		// Submit forgotten password account id
		$scope.askForPasswordReset = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/forgot', $scope.credentials).success(function(response) {
				// Show user success message and clear form
				$scope.credentials = null;
				$scope.success = response.message;

			}).error(function(response) {
				// Show user error message and clear form
				$scope.credentials = null;
				$scope.error = response.message;
			});
		};

		// Change user password
		$scope.resetUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.passwordDetails = null;

				// Attach user profile
				Authentication.user = response;

				// And redirect to the index page
				$location.path('/password/reset/success');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		// Check if there are additional accounts 
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}

			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);

				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
				}, function(response) {
					$scope.error = response.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', [
	function() {
		var _this = this;

		_this._data = {
			user: window.user
		};

		return _this._data;
	}
]);
'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
	function($resource) {
		return $resource('users', {}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);