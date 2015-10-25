'use strict';

//Sensor service used for communicating with the sensors REST endpoints
angular.module('core').factory('Alarm', ['$resource',
    function($resource) {
        return $resource('alarm');
    }
]);
