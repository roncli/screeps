var https = require("https"),
    child_process = require("child_process"),
    WebSocketClient = require("./websocketclient"),
    config = require("./config"),
    wsc,

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

    report = (data) => {
        var output = "";

        output += new Date(data.date) + " - Tick " + data.tick + "\n";
        output += "GCL " + data.gcl + " - " + data.progress.toFixed(0) + "/" + data.progressTotal.toFixed(0) + " - " + (100 * data.progress / data.progressTotal).toFixed(3) + "% - " + (data.progressTotal - data.progress).toFixed(0) + " to go" + "\n";
        output += "Credits - " + data.credits.toFixed(2) + "\n";

        for (let room in data.rooms) {
            let r = data.rooms[room];

            if (!r) {
                output += "Room - " + room + " undefined" + "\n";
                break;
            }

            output += "Room - " + r.type + " " + room;
            if (r.unobservable) {
                output += " - unobservable";
            } else if (r.rcl) {
                output += " - RCL " + r.rcl;
                if (r.progressTotal) {
                    output += " - " + r.progress.toFixed(0) + "/" + r.progressTotal.toFixed(0) + " - " + (100 * r.progress / r.progressTotal).toFixed(3) + "% - " + (r.progressTotal - r.progress).toFixed(0) + " to go";
                }
                if (r.ttd) {
                    output += " - TTD " + r.ttd;
                }
            } else if (r.reservedUsername) {
                output += " - Reserved " + r.reservedUsername + " - TTE " + r.tte; 
            } else if (r.controller) {
                output += " - Unowned";
            }
            output += "\n";

            for (let store in r.store) {
                let s = r.store[store];
                output += "  " + store + " - " + s.map((r) => r.resource + " " + r.amount).join(" - ") + "\n";
            }

            if (r.energyCapacityAvailable) {
                output += "  Energy - " + r.energyAvailable.toFixed(0) + "/" + r.energyCapacityAvailable.toFixed(0) + " - " + (100 * r.energyAvailable / r.energyCapacityAvailable).toFixed(0) + "% - " + (r.energyCapacityAvailable - r.energyAvailable).toFixed(0) + " to go" + "\n";
            }
            
            if (r.constructionProgressTotal) {
                output += "  Construction - " + r.constructionProgress.toFixed(0) + "/" + r.constructionProgressTotal.toFixed(0) + " - " + (100 * r.constructionProgress / r.constructionProgressTotal).toFixed(3) + "% - " + (r.constructionProgressTotal - r.constructionProgress).toFixed(0) + " to go" + "\n";
            }

            if (r.towerEnergyCapacity) {
                output += "  Towers - " + r.towerEnergy.toFixed(0) + "/" + r.towerEnergyCapacity.toFixed(0) + " - " + (100 * r.towerEnergy / r.towerEnergyCapacity).toFixed(0) + "% - " + (r.towerEnergyCapacity - r.towerEnergy).toFixed(0) + " to go" + "\n";
            }

            r.source.forEach((s) => {
                output += "    " + s.resource + " - " + s.amount;
                if (s.capacity) {
                    output += "/" + s.capacity;
                }
                if (s.ttr) {
                    output += " - TTR " + s.ttr;
                }
                output += "\n";
            });

            r.creeps.forEach((c) => {
                if (c.count < c.max) {
                    output += "  " + c.role + " " + c.count + "/" + c.max + "\n";
                }
            });
        }

        output += "Creeps - " + data.creeps.length + "\n";
        data.creeps.forEach((c) => {
            if (c.hits < c.hitsMax) {
                output += "  " + c.name + " " + c.room + " " + c.x + "," + c.y + " " + c.hits + "/" + c.hitsMax + " " + (100 * c.hits / c.hitsMax).toFixed(0) + "%" + "\n";
            }
        });

        data.spawns.forEach((s) => {
            if (s.spawningName) {
                output += "    " + s.room + " spawning " + s.spawningRole + " " + s.spawningName + " for " + s.spawningHome + " in " + s.spawningRemainingTime + "/" + s.spawningNeedTime + "\n";
            }
        });

        if (data.hostiles.length > 0) {
            output += "Hostiles" + "\n";
            data.hostiles.forEach((e) => {
                output += "  " + e.room + " " + e.x + "," + e.y + " " + e.hits + "/" + e.hitsMax + " " + (100 * e.hits / e.hitsMax).toFixed(0) + "% - " + e.ownerUsername + " - TTL " + e.ttl + "\n";
            });
        }

        if (data.events.length > 0) {
            output += "Events" + "\n";
            data.events.forEach((e) => {
                output += "  " + e + "\n";
            });
        }

        output += "CPU " + data.cpuUsed.toFixed(2) + "/" + data.limit + " - Bucket " + data.bucket.toFixed(0) + " - Tick Limit " + data.tickLimit + "\n";

        return output;
    },

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
            var data;

            if (message.startsWith("auth ok")) {
                wsc.send("subscribe user:" + id + "/console");
            }

            try {
                clear();
                JSON.parse(message)[1].messages.log.forEach((l) => {
                    try {
                        data = JSON.parse(l);

                        console.log(report(data));
                    } catch (err) {
                        console.log(l);
                        console.log();
                        console.log();
                        console.log();
                        console.log(err);
                    }
                });
            } catch (err) {
                clear();
                console.log(message);
                console.log();
                console.log();
                console.log();
                console.log(err);
            }
        };

        wsc.onerror = (err) => {
            wsc.reconnect();
        };

        wsc.onclose = (err) => {
            wsc = null;
            run();
        };

        wsc.open("wss://screeps.com/socket/websocket");
    };

run();
