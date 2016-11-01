var WebSocket = require("ws"),
    https = require("https"),
    child_process = require("child_process"),
    config = require("./config"),
    clear = () => {
        "use strict";

        switch (process.platform) {
            case "win32":
                console.log("\x1Bc");
                break;
            default:
                process.stdout.write(child_process.execSync("clear && printf '\\e[3J'"));
                break;
        }
    },

    run = () => {
        "use strict";

        var ws = new WebSocket("wss://screeps.com/socket/websocket"),
            authPost = "email=" + config.user + "&password=" + config.password,
            req = https.request({
                host: "screeps.com",
                path: "/api/auth/signin",
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(authPost)
                }
            }, function(res) {
                var signinResponse = "";

                res.on("data", function(chunk) {
                    signinResponse += chunk;
                });

                res.on("end", function() {
                    try {
                        var response = JSON.parse(signinResponse),
                            token = response.token,
                            req = https.request({
                                host: "screeps.com",
                                path: "/api/auth/me",
                                method: "GET",
                                headers: {
                                    "X-Token": token,
                                    "X-Username": config.user
                                }
                            }, function(res) {
                                var meResponse = "";

                                res.on("data", function(chunk) {
                                    meResponse += chunk;
                                });

                                res.on("end", function() {
                                    try {
                                        var response = JSON.parse(meResponse);

                                        id = response._id;
                                        ws.send("auth " + token);
                                    } catch (err) {
                                        run();
                                    }
                                });
                            });

                        req.end();
                    } catch (err) {
                        run();
                    }
                });
            }),

            id;

        req.write(authPost);
        req.end();

        ws.onmessage = function(message) {
            if (message.data.startsWith("auth ok")) {
                ws.send("subscribe user:" + id + "/console");
            }

            try {
                clear();
                JSON.parse(message.data)[1].messages.log.forEach((l) => {
                    console.log(l);
                });
            } catch (err) {
                clear();
                console.log(message.data);
                console.log(err);
            }
        };

        ws.onerror = function(err) {
            console.log(err);
            ws.close();
        };

        ws.onclose = function() {
            //run();
        };
    };

run();