var https = require("https"),
    child_process = require("child_process"),
    WebSocketClient = require("./websocketclient"),
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
    }, wsc

    run = () => {
        "use strict";

        var authPost = "email=" + config.user + "&password=" + config.password,
            id;

        if (wsc) {
            wsc.close();
            return;
        }

        wsc = new WebSocketClient();
        
        wsc.onopen = (err) => {
            var req;
            
            if (err) {
                console.log(err);
                return;
            }
            
            req = https.request({
                host: "screeps.com",
                path: "/api/auth/signin",
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(authPost)
                }
            }, (res) => {
                var signinResponse = "";

                res.on("data", (chunk) => {
                    signinResponse += chunk;
                });

                res.on("end", () => {
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
                            }, (res) => {
                                var meResponse = "";

                                res.on("data", (chunk) => {
                                    meResponse += chunk;
                                });

                                res.on("end", () => {
                                    try {
                                        var response = JSON.parse(meResponse);

                                        id = response._id;
                                        wsc.send("auth " + token);
                                    } catch (err) {
                                        wsc.reconnect();
                                    }
                                });
                            });

                        req.end();
                    } catch (err) {
                        run();
                    }
                });
            });

            req.write(authPost);
            req.end();
        };

        wsc.onmessage = (message) => {
            if (message.startsWith("auth ok")) {
                wsc.send("subscribe user:" + id + "/console");
            }

            try {
                clear();
                JSON.parse(message)[1].messages.log.forEach((l) => {
                    console.log(l);
                });
            } catch (err) {
                clear();
                console.log(message);
                console.log(err);
            }
        };

        wsc.onerror = (err) => {
            wsc.reconnect();
        };

        wsc.onclose = (err) => {
            wsc = null;
            wsc.reconnect();
        };

        wsc.open("wss://screeps.com/socket/websocket");
    };

run();