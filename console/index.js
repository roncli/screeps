var WebSocket = require("ws"),
    Screeps = require("screeps-api"),
    config = require("./config"),
    readline = require("readline"),
    express = require("express"),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ">_ "
    });

(() => {
    "use strict";

    var lastTick = 0,
        screeps = new Screeps(config),
        wss = new WebSocket.Server({port: 8081}),
        app = express(),
        server,

        socketOpen = () => {
            screeps.ws.on("close", () => {
                console.log("Screeps socket closed.  Reconnecting...");
                screeps.socket(socketOpen);
            });

            screeps.ws.on("error", (err) => {
                if (err.code === "ECONNREFUSED") {
                    console.log("Connection refused.  Reconnecting...");
                    screeps.socket(socketOpen);
                } else {
                    wss.broadcast({
                        message: "error",
                        type: "socket",
                        data: err
                    });
                }
            });
        };


    wss.broadcast = (message) => {
        message = JSON.stringify(message);

        wss.clients.forEach((client) => {
            client.send(message);
        });
    };

    screeps.socket(socketOpen);

    screeps.on("message", (msg) => {
        if (msg.startsWith("auth ok")) {
            screeps.subscribe("/console");
            console.log("Starting!");
            rl.prompt();
        }
    });

    screeps.on("console", (msg) => {
        var [user, data] = msg;

        Promise.resolve().then(() => screeps.memory.get("console")).then((memory) => {
            if (memory.tick > lastTick) {
                lastTick = memory.tick;
                wss.broadcast({
                    message: "data",
                    data: memory
                });
            }
        }).catch((err) => {
            wss.broadcast({
                message: "error",
                type: "api",
                data: err
            });
        });

        if (data.messages && data.messages.results) {
            data.messages.results.forEach((l) => console.log(l));
        }

        if (data.messages && data.messages.log) {
            data.messages.log.forEach((l) => console.log(l));
        }

        if (data.error) {
            wss.broadcast({
                message: "error",
                type: "console",
                data: data.error
            });

            console.log(data.error);
        }
    });

    rl.on("line", (line) => {
        line = line.trim();
        if (line === "exit") {
            process.exit();
            return;
        }
        screeps.console(line);
    });

    // Allow for static content in the public directory.
    app.use(express.static("public", {index: "index.htm"}));
    
    // jQuery.
    app.get("/js/jquery.min.js", (req, res) => {
        res.sendFile(__dirname + "/node_modules/jquery/dist/jquery.min.js");
    });

    // Bootstrap.
    app.get("/js/bootstrap.min.js", (req, res) => {
        res.sendFile(__dirname + "/node_modules/bootstrap/dist/js/bootstrap.min.js");
    });
    app.get("/css/bootstrap.min.css", (req, res) => {
        res.sendFile(__dirname + "/node_modules/bootstrap/dist/css/bootstrap.min.css");
    });
    app.get("/fonts/glyphicons-halflings-regular.eot", (req, res) => {
        res.sendFile(__dirname + "/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.eot");
    });
    app.get("/fonts/glyphicons-halflings-regular.svg", (req, res) => {
        res.sendFile(__dirname + "/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.svg");
    });
    app.get("/fonts/glyphicons-halflings-regular.ttf", (req, res) => {
        res.sendFile(__dirname + "/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf");
    });
    app.get("/fonts/glyphicons-halflings-regular.woff", (req, res) => {
        res.sendFile(__dirname + "/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff");
    });
    app.get("/fonts/glyphicons-halflings-regular.woff2", (req, res) => {
        res.sendFile(__dirname + "/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2");
    });

    // Angular.
    app.get("/js/angular.min.js", (req, res) => {
        res.sendFile(__dirname + "/node_modules/angular/angular.min.js");
    });

    // Moment.
    app.get("/js/moment.min.js", (req, res) => {
        res.sendFile(__dirname + "/node_modules/moment/min/moment.min.js");
    });
    
    // Force quit Screeps entirely.
    app.get("/quit", (req, res) => {
        res.status(200).send("The application has quit.  You will need to restart the server to continue.");
        server.close();
        cluster.worker.kill();
    });

    // Create the server.
    server = app.listen(8080);
})();
