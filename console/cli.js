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

    var screeps = new Screeps(config);

    screeps.socket(() => {
        screeps.ws.on("close", () => {
            throw "Screeps socket closed.  Reconnecting...";
        });

        screeps.ws.on("error", (err) => {
            if (err.code === "ECONNREFUSED") {
                throw "Connection refused.  Reconnecting...";
            } else {
                console.log(err);
            }
        });
    });

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
