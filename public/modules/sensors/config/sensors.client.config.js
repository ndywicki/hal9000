'use strict';

// Configuring the Sensors module
angular.module('sensors').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Sensors', 'sensors', 'dropdown', '/sensors(/create)?');
		Menus.addSubMenuItem('topbar', 'sensors', 'List Sensors', 'sensors');
	}
]);
