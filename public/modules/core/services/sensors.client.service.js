'use strict';

//Sensor service used for communicating with the sensors REST endpoints
angular.module('core').factory('Sensors', ['$resource',
    function($resource) {
        return $resource('sensors/:sensorId', {
            sensorId: '@_id'
        });
    }
]);
