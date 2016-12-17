/*jslint browser: true*/
/*global $, WebSocket, angular, moment*/

var app = angular.module("screeps", []),
    data = {
        start: {}
    };

(() => {
    "use strict";

    var ws, scope;

    app.directive("convertToNumber", function() {
        return {
            require: "ngModel",
            link: function(scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function(val) {
                    return +val;
                });
                ngModel.$formatters.push(function(val) {
                    return val ? val.toString() : "";
                });
            }
        };
    });

    app.directive("chrono", ["$interval", function($interval) {
        return {
            restrict: "E",
            scope: {
                direction: "@",
                time: "@"
            },
            link: function(scope, element) {
                var seconds, minutes, hours, timer,

                    tick = function() {
                        if (scope.direction === "down") {
                            seconds = Math.floor((scope.time - new Date().getTime()) / 1000);
                        } else {
                            seconds = Math.floor((new Date().getTime() - scope.time) / 1000);
                        }

                        if (seconds < 0) {
                            seconds = 0;
                        }

                        minutes = Math.floor(seconds / 60);
                        seconds = seconds % 60;

                        if (minutes < 60) {
                            scope.display = minutes.toString() + ":" + (seconds < 10 ? "0" : "") + seconds;
                            return;
                        }

                        hours = Math.floor(minutes / 60);
                        minutes = minutes % 60;

                        scope.display = hours.toString() + ":" + (minutes < 10 ? "0" : "") + minutes.toString() + ":" + (seconds < 10 ? "0" : "") + seconds;
                    };

                timer = $interval(tick, 1000);

                tick();

                element.on("$destroy", function() {
                    $interval.cancel(timer);
                    timer = null;
                });
            },
            template: "{{display}}"
        };
    }]);

    app.directive("offline", function() {
        return {
            restrict: "E",
            templateUrl: "/offline.htm"
        };
    });

    app.directive("error", function() {
        return {
            restrict: "E",
            templateUrl: "/error.htm"
        };
    });

    app.directive("waiting", function() {
        return {
            restrict: "E",
            templateUrl: "/waiting.htm"
        };
    });
    
    app.directive("general", function() {
        return {
            restrict: "E",
            templateUrl: "/general.htm"
        };
    });

    app.directive("rcls", function() {
        return {
            restrict: "E",
            templateUrl: "/rcls.htm"
        };
    });

    app.directive("bases", function() {
        return {
            restrict: "E",
            templateUrl: "/bases.htm"
        };
    });

    app.directive("mines", function() {
        return {
            restrict: "E",
            templateUrl: "/mines.htm"
        };
    });

    app.directive("cleanups", function() {
        return {
            restrict: "E",
            templateUrl: "/cleanups.htm"
        };
    });

    app.directive("unknowns", function() {
        return {
            restrict: "E",
            templateUrl: "/unknowns.htm"
        };
    });

    app.directive("armies", function() {
        return {
            restrict: "E",
            templateUrl: "/armies.htm"
        };
    });

    app.controller("screeps", ["$scope", function($scope) {
        $scope.data = data;

        $scope.Math = Math;
        $scope.moment = moment;

        $scope.getTimestamp = function(time) {
            var seconds = time / 1000,
                minutes, hours;

            if (seconds <= 59.999) {
                return seconds.toFixed(2);
            }

            minutes = Math.floor(seconds / 60);
            seconds = seconds % 60;

            if (minutes < 60) {
                return minutes.toString() + ":" + (seconds <= 9.999 ? "0" : "") + seconds.toFixed(2);
            }

            hours = Math.floor(minutes / 60);
            minutes = minutes % 60;

            return hours.toString() + ":" + (minutes < 10 ? "0" : "") + minutes.toString() + ":" + (seconds <= 9.999 ? "0" : "") + seconds.toFixed(2);
        };
    }]);

    $(document).ready(function() {
        var createWebsocketClient = function() {
            var connected = false;
            ws = new WebSocket("ws://" + window.location.hostname + ":8081");

            ws.onopen = function() {
                connected = true;
            };

            ws.onclose = function() {
                if (connected) {
                    // If the server shut down, attempt to reconnect once.
                    setTimeout(function() {
                        createWebsocketClient();
                    }, 1000);
                } else {
                    data.offline = true;
                    scope.$apply();
                }
            };

            ws.onmessage = function(ev) {
                var message = JSON.parse(ev.data);

                switch (message.message) {
                    case "data":
                        data.memory = message.data;
                        
                        // Setup start ticks
                        if (!data.start.gcl || data.memory.progress < data.start.gcl.progress) {
                            data.start.gcl = {
                                progress: data.memory.progress,
                                date: data.memory.date
                            }
                        }
                        if (data.memory.rooms) {
                            for (let name in data.memory.rooms) {
                                let room = data.memory.rooms[name];
                                if (!data.start[name] || room.progress < data.start[name].progress) {
                                    data.start[name] = {
                                        progress: room.progress,
                                        date: data.memory.date
                                    }
                                }
                            }
                        }
                        
                        scope.$apply();
                        break;
                    case "error":
                        // TODO: Show error.
                        
                        scope.$apply();
                        break;
                }
            };
        };

        scope = angular.element("html").scope();
        createWebsocketClient();
    });
})();
