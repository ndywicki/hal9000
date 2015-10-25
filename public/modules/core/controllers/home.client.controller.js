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
