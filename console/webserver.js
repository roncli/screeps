var cluster = require("cluster"),
    express = require("express");

module.exports = () => {
    "use strict";

    var app = express(),
        server;

    // Only allow connections on the localhost.
    app.use((req, res, next) => {
        if (req.headers.host === "localhost:3911") {
            next();
        } else {
            res.status(404).send("Not found");
        }
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
    server = app.listen(3911);

    // Log any errors and restart the worker.
    process.on("uncaughtException", (err) => {
        "use strict";
        
        console.log("A web server error occurred:", err);

        try {
            if (server) {
                server.close();
            }
        } finally {
            setTimeout(() => {
                cluster.worker.disconnect();
                process.exit();
            });
        }
    });
};
