'use strict';

var Sms = require('sms-freemobile-api'),
    process = require('process');


var sms = new Sms({
	user: process.env.SMS_USER,
	pass: process.env.SMS_PWD
});


/**
* Sent alert
*/
exports.sent = function(req, res) {
	var message = req.params.message;
	console.log('sent Alert:'+message);
    sms.sent(message, function(res){

    });
    res.json('Alert message sent:' + message);
};
