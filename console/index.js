const WebSocket = require("ws"),
    wss = new WebSocket.Server({port: 8081}),
    {ScreepsAPI} = require("screeps-api"),
    config = require("./config"),
    screeps = new ScreepsAPI(config),
    readline = require("readline"),
    express = require("express"),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ">_ "
    });

class Index {
    static async main() {
        const app = express();
        let lastTick = 0;

        wss.broadcast = (message) => {
            message = JSON.stringify(message);

            wss.clients.forEach((client) => {
                client.send(message);
            });
        };

        wss.on("connection", (socket) => {
            socket.on("message", (data) => {
                if (data === "init") {
                    lastTick = 0;
                }
            });
        });

        await Index.connect();

        screeps.socket.on("close", () => {
            console.log("Screeps socket closed.  Reconnecting...");
            Index.connect();
        });

        screeps.socket.on("unexpected-response", () => {
            console.log("Unexpected response from screeps.  Reconnecting...");
            Index.connect();
        });

        screeps.socket.on("error", (err) => {
            if (err.code === "ECONNREFUSED") {
                console.log("Connection refused.  Reconnecting...");
                Index.connect();
            } else {
                wss.broadcast({
                    message: "error",
                    type: "socket",
                    data: err
                });
            }
        });

        screeps.socket.subscribe("console", (ev) => {
            const {data} = ev;

            screeps.memory.get("survey")
                .then((data) => {
                    const {data: survey} = data;

                    if (survey.lastPoll > lastTick) {
                        ({lastPoll: lastTick} = survey);
                        wss.broadcast({
                            message: "survey",
                            survey
                        });

                        screeps.memory.get("creepCount")
                            .then((data) => {
                                const {data: creepCount} = data;

                                wss.broadcast({
                                    message: "creepCount",
                                    creepCount
                                });
                            })
                            .catch((err) => {
                                wss.broadcast({
                                    message: "error",
                                    type: "api",
                                    data: err
                                });
                            });
                    }
                })
                .catch((err) => {
                    wss.broadcast({
                        message: "error",
                        type: "api",
                        data: err
                    });
                });

            screeps.memory.get("stats")
                .then((data) => {
                    const {data: stats} = data;

                    wss.broadcast({
                        message: "stats",
                        stats
                    });
                })
                .catch((err) => {
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

        console.log("Starting!");
        rl.prompt();

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
            res.sendFile(`${__dirname}/node_modules/jquery/dist/jquery.min.js`);
        });

        // Bootstrap.
        app.get("/js/bootstrap.min.js", (req, res) => {
            res.sendFile(`${__dirname}/node_modules/bootstrap/dist/js/bootstrap.min.js`);
        });
        app.get("/css/bootstrap.min.css", (req, res) => {
            res.sendFile(`${__dirname}/node_modules/bootstrap/dist/css/bootstrap.min.css`);
        });
        app.get("/fonts/glyphicons-halflings-regular.eot", (req, res) => {
            res.sendFile(`${__dirname}/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.eot`);
        });
        app.get("/fonts/glyphicons-halflings-regular.svg", (req, res) => {
            res.sendFile(`${__dirname}/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.svg`);
        });
        app.get("/fonts/glyphicons-halflings-regular.ttf", (req, res) => {
            res.sendFile(`${__dirname}/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf`);
        });
        app.get("/fonts/glyphicons-halflings-regular.woff", (req, res) => {
            res.sendFile(`${__dirname}/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff`);
        });
        app.get("/fonts/glyphicons-halflings-regular.woff2", (req, res) => {
            res.sendFile(`${__dirname}/node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2`);
        });

        // Moment.
        app.get("/js/moment.min.js", (req, res) => {
            res.sendFile(`${__dirname}/node_modules/moment/min/moment.min.js`);
        });

        // Create the server.
        const server = app.listen(8080);

        // Force quit Screeps entirely.
        app.get("/quit", (req, res) => {
            res.status(200).send("The application has quit.  You will need to restart the server to continue.");
            server.close();
            process.exit();
        });
    }
    
    static async connect() {
        return new Promise(async (resolve) => {
            let ok = 0;
            
            while (ok !== 1) {
                try {
                    ({ok} = await screeps.auth(config.email, config.password));
                } finally {}
                if (ok === 1) {
                    try {
                        await screeps.socket.connect();
                    } catch (err) {
                        ok = 0;
                    }
                } else {
                    console.log("Unable to connect, retrying in 5 seconds...");
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
            }
    
            console.log("Connected.");
            
            resolve();
        });
    }
}

Index.main();
