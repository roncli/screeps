var run = () => {
    var WebSocket = require("ws"),
        https = require("https"),
        config = require("./config"),
        ws = new WebSocket("wss://screeps.com/socket/websocket"),
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
            console.log("\033c");
            JSON.parse(message.data)[1].messages.log.forEach((l) => {
                console.log(l);
            });
        } catch (err) {}
    };

    ws.onerror = function(err) {
        console.log(err);
    };

    ws.onclose = function() {
        run();
    };
};

run();