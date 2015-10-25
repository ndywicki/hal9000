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
