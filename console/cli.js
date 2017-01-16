var Screeps = require("screeps-api"),
    config = require("./config"),
    readline = require("readline"),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ">_ "
    });

(() => {
    "use strict";

    var screeps = new Screeps(config),
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
                    console.log(err);
                }
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

        if (data.messages && data.messages.results) {
            data.messages.results.forEach((l) => console.log(l));
        }
        if (data.messages && data.messages.log) {
            data.messages.log.forEach((l) => console.log(l));
        }
        if (data.error) {
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
})();
