var cluster = require("cluster"),
    WebSocket = require("ws"),
    Screeps = require("screeps-api"),
    config = require("./config");

module.exports = () => {
    "use strict";

    var lastTick = 0,
        screeps = new Screeps(config),
        wss = new WebSocket.Server({port: 8081});

    wss.broadcast = (message) => {
        message = JSON.stringify(message);

        wss.clients.forEach((client) => {
            client.send(message);
        });
    };

    screeps.socket(() => {
        screeps.ws.on("close", () => {
            throw "Screeps socket closed.  Reconnecting...";
        });

        screeps.ws.on("error", (err) => {
            if (err.code === "ECONNREFUSED") {
                throw "Connection refused.  Reconnecting...";
            } else {
                wss.broadcast({
                    message: "error",
                    type: "socket",
                    data: err
                });
            }
        });
    });

    screeps.on("message", (msg) => {
        if (msg.startsWith("auth ok")) {
            screeps.subscribe("/console");
        }
    });

    screeps.on("console", (msg) => {
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

        if (msg[1].error) {
            wss.broadcast({
                message: "error",
                type: "console",
                data: msg[1].error
            });
        }
    });

    // Log any errors and restart the worker.
    process.on("uncaughtException", (err) => {
        try {
            if (wss) {
                wss.broadcast({
                    message: "error",
                    type: "unknown",
                    data: err
                });
                wss.close();
            }
        } finally {
            setTimeout(() => {
                cluster.worker.disconnect();
                process.exit();
            });
        }
    });
};
