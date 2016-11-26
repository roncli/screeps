var https = require("https"),
    child_process = require("child_process"),
    WebSocketClient = require("./websocketclient"),
    config = require("./config"),
    wsc,

    clear = () => {
        "use strict";

        switch (process.platform) {
            case "win32":
                process.stdout.write("\x1B[2J");
                break;
            default:
                process.stdout.write(child_process.execSync("clear && printf '\\e[3J'"));
                break;
        }
    },

    report = (data) => {
        try {
            var output;

            console.log(new Date(data.date) + " - Tick " + data.tick);
            console.log("GCL " + data.gcl + " - " + data.progress.toFixed(0) + "/" + data.progressTotal.toFixed(0) + " - " + (100 * data.progress / data.progressTotal).toFixed(3) + "% - " + (data.progressTotal - data.progress).toFixed(0) + " to go");
            console.log("Credits - " + data.credits.toFixed(2));

            for (let room in data.rooms) {
                let r = data.rooms[room];

                if (!r) {
                    console.log("Room - " + room + " undefined");
                    break;
                }

                output = "Room - " + r.type + " " + room;
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
                console.log(output);

                for (let store in r.store) {
                    let s = r.store[store];
                    console.log("  " + store + " - " + s.map((r) => r.resource + " " + r.amount).join(" - "));
                }

                if (r.energyCapacityAvailable) {
                    console.log("  Energy - " + r.energyAvailable.toFixed(0) + "/" + r.energyCapacityAvailable.toFixed(0) + " - " + (100 * r.energyAvailable / r.energyCapacityAvailable).toFixed(0) + "% - " + (r.energyCapacityAvailable - r.energyAvailable).toFixed(0) + " to go");
                }
                
                if (r.constructionProgressTotal) {
                    console.log("  Construction - " + r.constructionProgress.toFixed(0) + "/" + r.constructionProgressTotal.toFixed(0) + " - " + (100 * r.constructionProgress / r.constructionProgressTotal).toFixed(3) + "% - " + (r.constructionProgressTotal - r.constructionProgress).toFixed(0) + " to go");
                }

                if (r.towerEnergyCapacity) {
                    console.log("  Towers - " + r.towerEnergy.toFixed(0) + "/" + r.towerEnergyCapacity.toFixed(0) + " - " + (100 * r.towerEnergy / r.towerEnergyCapacity).toFixed(0) + "% - " + (r.towerEnergyCapacity - r.towerEnergy).toFixed(0) + " to go");
                }

                if (r.labEnergyCapacity) {
                    console.log("  Labs - " + r.labEnergy.toFixed(0) + "/" + r.labEnergyCapacity.toFixed(0) + " - " + (100 * r.labEnergy / r.labEnergyCapacity).toFixed(0) + "% - " + (r.labEnergyCapacity - r.labEnergy).toFixed(0) + " to go");
                }

                if (r.lowestWall) {
                    console.log("  Lowest Wall - " + r.lowestWall.hits.toFixed(0));
                }

                r.source.forEach((s) => {
                    if (r.type !== "base" && s.resource !== "energy") {
                        return;
                    }
                    output = "    " + s.resource + " - " + s.amount;
                    if (s.capacity) {
                        output += "/" + s.capacity;
                    }
                    if (s.ttr) {
                        output += " - TTR " + s.ttr;
                    }
                    console.log(output);
                });

                r.creeps.forEach((c) => {
                    if (c.count < c.max) {
                        console.log("  " + c.role + " " + c.count + "/" + c.max);
                    }
                });
            }

            for (let army in data.army) {
                let a = data.army[army];

                console.log("Army " + army + " - " + a.directive + " - Build at " + a.buildRoom + " - Stage at " + a.stageRoom + " - Attacking " + a.attackRoom);
                
                if (a.dismantle > 0) {
                    console.log("  Initial structures to dismantle: " + a.dismantle);
                }

                if (a.structures > 0) {
                    console.log("  Structures to dismantle: " + a.structures);
                }

                if (a.constructionSites > 0) {
                    console.log("  Construction sites to stomp: " + a.constructionSites);
                }

                a.creeps.forEach((c) => {
                    console.log("    " + c.role + " " + c.count + "/" + c.max);
                });
            }

            console.log("Creeps - " + data.creeps.length);
            data.creeps.forEach((c) => {
                if (c.hits < c.hitsMax) {
                    console.log("  " + c.name + " " + c.room + " " + c.x + "," + c.y + " " + c.hits + "/" + c.hitsMax + " " + (100 * c.hits / c.hitsMax).toFixed(0) + "%");
                }
            });

            data.spawns.forEach((s) => {
                if (s.spawningName) {
                    if (s.spawningHome) {
                        console.log("    " + s.room + " spawning " + s.spawningRole + " " + s.spawningName + " for room " + s.spawningHome + " in " + s.spawningRemainingTime + "/" + s.spawningNeedTime);
                    } else if (s.spawningArmy) {
                        console.log("    " + s.room + " spawning " + s.spawningRole + " " + s.spawningName + " for army " + s.spawningArmy + " in " + s.spawningRemainingTime + "/" + s.spawningNeedTime);
                    } else {
                        console.log("    " + s.room + " spawning " + s.spawningRole + " " + s.spawningName + " in " + s.spawningRemainingTime + "/" + s.spawningNeedTime);
                    }
                }
            });

            if (data.hostiles.length > 0) {
                console.log("Hostiles");
                data.hostiles.forEach((e) => {
                    console.log("  " + e.room + " " + e.x + "," + e.y + " " + e.hits + "/" + e.hitsMax + " " + (100 * e.hits / e.hitsMax).toFixed(0) + "% - " + e.ownerUsername + " - TTL " + e.ttl);
                });
            }

            if (data.events.length > 0) {
                console.log("Events");
                data.events.forEach((e) => {
                    console.log("  " + e);
                });
            }

            console.log("CPU " + data.cpuUsed.toFixed(2) + "/" + data.limit + " - Bucket " + data.bucket.toFixed(0) + " - Tick Limit " + data.tickLimit);

            return output;
        } catch (err) {
            console.log(err);
            return;
        }
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
            var data, reportData;

            if (message.startsWith("auth ok")) {
                wsc.send("subscribe user:" + id + "/console");
            }

            try {
                clear();
                JSON.parse(message)[1].messages.log.forEach((l) => {
                    try {
                        data = JSON.parse(l);
                        report(data);
                    } catch (err) {
                        console.log(l);
                        console.log("");
                        console.log("");
                        console.log("");
                        console.log(err);
                    }
                });
            } catch (err) {
                clear();
                console.log(message);
                console.log("");
                console.log("");
                console.log("");
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
