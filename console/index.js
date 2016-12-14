var cluster = require("cluster"),
    webserver = require("./webserver"),
    websocket = require("./websocket"),
    webServerWorker, webSocketWorker;

// Use clustering to spawn separate processes.
if (cluster.isMaster) {
    webServerWorker = cluster.fork({
        screepsJob: "webserver"
    });
    webSocketWorker = cluster.fork({
        screepsJob: "websocket"
    });

    cluster.on("disconnect", (worker) => {
        "use strict";

        if (worker.suicide) {
            // Worker was intentionally disconnected, end the application.
            if (webServerWorker.isConnected()) {
                webServerWorker.kill();
            }
            if (webSocketWorker.isConnected()) {
                webSocketWorker.kill();
            }
            process.exit();
        } else {
            // Worker was unintentionally disconnected, restart any disconnected workers.
            if (!webServerWorker.isConnected()) {
                webServerWorker = cluster.fork({
                    screepsJob: "webserver"
                });
            }
            if (!webSocketWorker.isConnected()) {
                webSocketWorker = cluster.fork({
                    screepsJob: "websocket"
                });
            }
        }
    });

    cluster.on("exit", () => {
        "use strict";

        if (!webServerWorker.isConnected()) {
            webServerWorker = cluster.fork({
                screepsJob: "webserver"
            });
        }
        if (!webSocketWorker.isConnected()) {
            webSocketWorker = cluster.fork({
                screepsJob: "websocket"
            });
        }
    });
} else {
    switch (process.env.screepsJob) {
        case "webserver":
            webserver();
            break;
        case "websocket":
            websocket();
            break;
    }
}