'use strict';

angular.module('core').factory('weatherService', function($http) {
    return {
        getWeather: function() {
            var weather = { name: {}, weather: {}, temp: {}, clouds: null };
            var url = 'http://api.openweathermap.org/data/2.5/weather?q=Paris,Fr&units=metric&callback=JSON_CALLBACK&lang=fr&appid=0d630d38d05d0ba934871a0bbfa208a8';
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
});
