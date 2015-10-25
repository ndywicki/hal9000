'use strict';

angular.module('core').factory('smsApiService', function($http, Alert) {
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
});
