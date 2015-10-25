'use strict';

var config = require('./../config/config'),
	five = require('johnny-five'),
	util = require('util'),
	events = require('events'),
    async = require('async'),
    MCP23017 = require('./lib/mcp.js'),
	mongoose = require('mongoose'),
    // arduino.js loading dependencies before the model globbing in Express.js
    // use this instead directly EventModel = mongoose.model('EventModel');
    EventModel = require('./../app/models/event.server.model'),
    SensorModel = require('./../app/models/sensor.server.model'),
    AlarmModel = require('./../app/models/alarm.server.model');
EventModel = mongoose.model('EventModel');
SensorModel = mongoose.model('SensorModel');
AlarmModel = mongoose.model('AlarmModel');

var board = new five.Board({
    port: config.arduino.serialport
});

var sensors = [
    {pin: 0, id:'GPA01', type: 'sensor_motion', label:'Hall d\'entrée'},
    {pin: 1, id:'GPA02', type: 'sensor_motion', label:'Salon'},
    {pin: 2, id:'GPA03', type: 'sensor_motion', label:'Chambre'},
    {pin: 3, id:'GPA04', type: 'sensor_magnet', label:'Porte d\'entrée'},
    {pin: 4, id:'GPA05', type: 'sensor_magnet', label:'Porte de garage'}
];

var inputs = [
    {pin: 5, mcp:'GPA07', type: 'input', label:'Alimentation'},
    {pin: 6, mcp:'GPA07', type: 'input', label:'Protection clavier'}
];

var alarms = [
    {pin: 8, mcp:'GPB01', type: 'siren', label:'entrée'}
];


//private variables
var led, button, alarmMode, alarmStatus, alarmTempo;
var AlarmStatusEnum = Object.freeze({'off':0, 'on':1});
var AlarmModeEnum = Object.freeze({'standby':'standby', 'perimetrique':'perimetrique', 'complet':'complet'});

function Arduino() {
    events.EventEmitter.call(this);

    var self = this;
    //MCP23017
    var mcp;


    var checkAlarm = function(sensor) {
        console.log('checkAlarm alarmMode:'+alarmMode+' alarmStatus:'+alarmStatus + ' sensor.type:'+sensor.type+' alarmTempo:'+alarmTempo);
        if(AlarmStatusEnum.on !== alarmStatus) {
            // Do nothing if standby mode
            if (alarmMode === AlarmModeEnum.standby) { return; }
            if (alarmMode === AlarmModeEnum.perimetrique && sensor.type !== 'sensor_magnet') { return; }

            // Else active siren with delay tempo
            setTimeout(function() {
                alarmStatus = AlarmStatusEnum.on;
                mcp.digitalWrite(alarms[0].pin, false);
                // update alarm
                AlarmModel.findOne({}, function (err, alarm) {
                    //var alertes = alarm.alertes + 1;
                    AlarmModel.findOneAndUpdate({},
                        { $set : {siren: true}}, { $inc : {alertes : 1}},
                        {upsert: true}, function (err, alarm) {
                        if (err) {
                            console.log('err:' + err);
                        }
                        console.log('arduino: alarm-siren-on');
                        self.emit('arduino-alarm-siren-on', alarm);
                    });
                });
                var eventData = {eventId: 'System', content: '!! Siren on !!'};
                var eventModel = new EventModel(eventData);
                eventModel.save(function (err, event) {
                    if (err) {
                        console.log(err);
                    }
                    self.emit('arduino-event', event);
                });
            }, alarmTempo * 1000);
        }
    };

    var readSensorCallback = function (pin, value) {
        if (pin < sensors.length) {
            var sensor = sensors[pin];
            console.log('Sensor ' + sensor.pin + ' hit:' + value);
            // update sensor status
            //var sensorData = {id: sensor.id, type: sensor.type, description: sensor.label, active: value};
            SensorModel.findOneAndUpdate({id: sensor.id}, {active: value}, {upsert: true}, function (err, sensor) {
                if (err) {
                    console.log('findOneAndUpdate err:' + err);
                }
                //console.log('sensor updated:'+sensor);
                self.emit('arduino-sensor-hit', sensor);
            });

            //Sensor hit
            if(value) {
                //check alarm
                checkAlarm(sensor);
                //update alarm actions counter
                AlarmModel.findOne({}, function(err, alarm) {
                    //var actions = alarm.actions + 1;
                    AlarmModel.findOneAndUpdate({}, {$inc : {actions : 1} }, {upsert: true}, function (err, alarm) {
                        if (err) {
                            console.log('err:' + err);
                        }
                        self.emit('arduino-alarm-counters-updated', alarm);
                    });
                });
                //Add event log
                var eventData = {eventId: 'Mouvement detecté ', content: 'Capteur ' + sensor.label};
                var eventModel = new EventModel(eventData);
                eventModel.save(function (err, event) {
                    if (err) {
                        console.log(err);
                    }
                    self.emit('arduino-event', event);
                });
            }
        } else  {
            console.log('read pin not configured');
        }
    };

    function initSensor(sensor) {
        // update sensor status
        var sensorData = {id: sensor.id, type: sensor.type, description: sensor.label, active: false};
        SensorModel.findOneAndUpdate({id: sensor.id}, sensorData, {upsert: true}, function (err) {
            if (err) {
                console.log('init error:' + err);
            }
        });

        //mcp.digitalRead(sensor.pin, function (pin, value) {
        //    console.log('data:' + value + ' pin:' + pin);
        //});
        //attach callback
        mcp.digitalRead(sensor.pin, readSensorCallback);
    }

    board.on('ready', function (err) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Arduino ready...');

        led = new five.Led(13);
        button = new five.Button({
            pin: 2,
            isPullup: true
        });

        //relay test
        var relay = new five.Led(12);
        relay.on();

        button.on('down', function (value) {
            led.on();
            self.emit('arduino-btn-down', 'Button down');

        });

        button.on('up', function () {
            led.off();
            self.emit('arduino-btn-up', 'Button up');
        });


        var io = board.io;
        board.io.pinMode(12, io.MODES.OUTPUT);
        board.io.digitalWrite(12, io.HIGH);

        // MCP23017 setup
        mcp = new MCP23017(board);

        //Init alarm status
        alarmMode = AlarmModeEnum.standby;
        alarmStatus = AlarmStatusEnum.off;
        AlarmModel.count({}, function(err, count) {
            if(count === 0) {
                //Init alarm configuration
                var alarmData = { status: alarmMode, alertes: 0, actions: 0, tempo: 30, siren: false };
                //force not empty query {} for the first time populate ...
                AlarmModel.findOneAndUpdate({'alertes' : { '$gt' : 0}}, alarmData, {upsert: true}, function (err, alarm) {
                    if (err) {
                        console.log('findOneAndUpdate err:' + err);
                    }
                });
            }
        });


        //Init sensors
        for (var i = 0; i < sensors.length; i++) {
            //init sensor status
            var sensor = sensors[i];
            console.log('INIT init sensors[i]:' + sensors[i].id+' i:'+i);
            initSensor(sensor);
        }
        //Init inputs
        //mcp.digitalRead(inputs[0].pin, function (pin, value) {
        //    console.log('input:'+inputs[0].label + ' value:'+value );
        //});

        Arduino.prototype.modeComplet = function() {
            console.log('System active mode complet !');
            led.on();
            var eventData = {eventId: 'System', content: 'Alarm mode complet actif' };
            var eventModel = new EventModel(eventData);
            eventModel.save(function (err, event) {
                if (err) {
                    console.log(err);
                }
                self.emit('arduino-event', event);
            });
            alarmMode = AlarmModeEnum.complet;
            AlarmModel.findOneAndUpdate({}, {status: alarmMode}, {upsert: true}, function (err, alarm) {
                if (err) {
                    console.log('findOneAndUpdate err:' + err);
                }
                ////console.log('sensor updated:'+sensor);
                //self.emit('sensor-hit', sensor);
            });
        };
        Arduino.prototype.modePerimetrique = function() {
            console.log('System active mode perimetrique !');
            led.on();
            var eventData = {eventId: 'System', content: 'Alarm mode périmètrique actif' };
            var eventModel = new EventModel(eventData);
            eventModel.save(function (err, event) {
                if (err) {
                    console.log(err);
                }
                self.emit('arduino-event', event);
            });
            alarmMode = AlarmModeEnum.perimetrique;
            AlarmModel.findOneAndUpdate({}, {status: alarmMode}, {upsert: true}, function (err, alarm) {
                if (err) {
                    console.log('findOneAndUpdate err:' + err);
                }
            });
        };
        Arduino.prototype.modeStandby = function() {
            console.log('System desactive mode standby!');
            this.disableAlarm();
            var eventData = {eventId: 'System', content: 'Alarm mode standby' };
            var eventModel = new EventModel(eventData);
            eventModel.save(function (err, event) {
                if (err) {
                    console.log(err);
                }
                self.emit('arduino-event', event);
            });
            alarmMode = AlarmModeEnum.standby;
            alarmStatus = AlarmStatusEnum.off;
            AlarmModel.findOneAndUpdate({}, {siren: false, status: alarmMode}, {upsert: true}, function (err, alarm) {
                if (err) {
                    console.log('findOneAndUpdate err:' + err);
                }
            });
        };

        Arduino.prototype.disableAlarm = function() {
            //Disabled siren
            mcp.digitalWrite(alarms[0].pin, true);
            led.off();
        };

        Arduino.prototype.setTempo = function(value) {
            var eventData = {eventId: 'System', content: 'Alarm tempo set for ' + value };
            var eventModel = new EventModel(eventData);
            eventModel.save(function (err, event) {
                if (err) {
                    console.log(err);
                }
                self.emit('arduino-event', event);
            });

            alarmTempo = value;
            AlarmModel.findOneAndUpdate({}, {tempo: alarmTempo}, {upsert: true}, function (err, alarm) {
                if (err) {
                    console.log('findOneAndUpdate err:' + err);
                }
            });
        };

        self.emit('arduino-ready', 'arduino ready');
    });
}

util.inherits(Arduino, events.EventEmitter);

Arduino.prototype.ledOn = function() {
    led.on();
};

Arduino.prototype.ledOff = function() {
    led.off();
};

module.exports = Arduino;

