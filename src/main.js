var profiler = require("screeps-profiler"),
    Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleDelivery = require("role.delivery"),
    RoleHealer = require("role.healer"),
    RoleMiner = require("role.miner"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleReserver = require("role.reserver"),
    RoleStorer = require("role.storer"),
    RoleTower = require("role.tower"),
    RoleWorker = require("role.worker"),
    RoomBase = require("room.base"),
    taskDeserialization = require("taskDeserialization"),
    roomDeserialization = require("roomDeserialization"),
    
    main = {
        loop: () => {
            "use strict";

            profiler.wrap(() => {
                // Reset the cache.
                Cache.reset();

                // Upgrade creep memory
                if (!Memory.runOnce) {
                    _.forEach(Game.creeps, (creep) => {
                        switch (creep.role) {
                            case "collector":
                            case "worker":
                                creep.memory.homeSource = creep.memory.home;
                                creep.memory.home = Cache.getObjectById(creep.memory.homeSource).room.name;
                                break;
                            case "delivery":
                                creep.memory.homeSource = creep.memory.home;
                                creep.memory.home = creep.memroy.deliver;
                                delete creep.memory.deliver;
                                break;
                            case "miner":
                                creep.memory.home = Cache.getObjectById(creep.memory.container).room.name;
                                break;
                            case "storer":
                                creep.memory.home = creep.room.name;
                                break;
                        }
                    });
                    Memory.runOnce = true;
                }

                // Export global objects to Game.cmd for use from console.
                Game.cmd = {
                    Cache: Cache,
                    Commands: Commands,
                    Role: {
                        Claimer: RoleClaimer,
                        Collector: RoleCollector,
                        Defender: RoleDefender,
                        Delivery: RoleDelivery,
                        Healer: RoleHealer,
                        Miner: RoleMiner,
                        RangedAttack: RoleRangedAttack,
                        Reserver: RoleReserver,
                        Storer: RoleStorer,
                        Tower: RoleTower,
                        Worker: RoleWorker
                    },
                    Room: {
                        Base: RoomBase
                    },
                    Utilities: Utilities
                };
                
                // Initialize max creeps.
                if (!Memory.maxCreeps) {
                    Memory.maxCreeps = {
                        healer: 0,
                        meleeAttack: 0,
                        rangedAttack: 0
                    };
                }

                // Log date, GCL, and credits.
                console.log(new Date());
                console.log("Global level " + Game.gcl.level + " " + Game.gcl.progress + "/" + Game.gcl.progressTotal.toFixed(0) + " " + (100 * Game.gcl.progress / Game.gcl.progressTotal).toFixed(3) + "%");
                console.log("Credits: " + Game.market.credits.toFixed(2));

                // Clear old memory.
                _.forEach(Memory.creeps, (creep, name) => {
                    if (!Game.creeps[name]) {
                        delete Memory.creeps[name];
                    }
                });

                // Loop through each creep to deserialize their task and see if it is completed.
                _.forEach(Game.creeps, (creep) => {
                    if (creep.memory.currentTask) {
                        taskDeserialization(creep);
                        if (Cache.creepTasks[creep.name]) {
                            Cache.creepTasks[creep.name].canComplete(creep);
                        }
                    }
                });

                // Lop through each room in memory to deserialize their type.
                _.forEach(Memory.rooms, (roomMemory, name) => {
                    if (roomMemory && roomMemory.roomType) {
                        roomDeserialization(roomMemory, name);
                    }
                });

                // Loop through each room to determine the required tasks for the room.
                _.forEach(Game.rooms, (room) => {
                    // Log room status.
                    if (room.controller) {
                        if (room.controller.my) {
                            if (room.controller.level === 8) {
                                console.log("  " + room.name + " Controller level " + room.controller.level);
                            } else {
                                console.log("  " + room.name + " Controller level " + room.controller.level + " " + room.controller.progress + "/" + room.controller.progressTotal + " " + (100 * room.controller.progress / room.controller.progressTotal).toFixed(3) + "%");
                            }
                        } else if (room.controller.level === 0) {
                            if (room.controller.reservation) {
                                console.log("  " + room.name + " Controller reserved " + room.controller.reservation.username + " TTE " + room.controller.reservation.ticksToEnd);
                            } else {
                                console.log("  " + room.name + " Controller unowned");
                            }
                        } else {
                            console.log("  " + room.name + " Controller level " + room.controller.level + " owned by " + room.controller.owner.username);
                        }
                    } else {
                        console.log("  " + room.name);
                    }

                    _.forEach(Cache.energySourcesInRoom(room), (s) => {
                        console.log("    Source " + s.id + ": " + s.energy + "/" + s.energyCapacity + " TTR " + s.ticksToRegeneration);
                    });

                    _.forEach(Cache.mineralsInRoom(room), (m) => {
                        console.log("    Mineral " + m.mineralType + " " + m.id + ": " + m.mineralAmount + " TTR " + m.ticksToRegeneration);
                    });

                    if (room.storage && _.sum(room.storage.store) > 0) {
                        console.log("    Storage: " + _.map(room.storage.store, (s, i) => {return s + " " + i;}).join(", "));
                    }

                    if (room.terminal && _.sum(room.terminal.store) > 0) {
                        console.log("    Terminal: " + _.map(room.terminal.store, (s, i) => {return s + " " + i;}).join(", "));
                    }

                    if (Cache.roomTypes[room.name]) {
                        Cache.roomTypes[room.name].run(room);
                    }
                });
                
                // Loop through each creep to run its current task, prioritizing most energy being carried first, and then serialize it.
                _.forEach(Game.creeps, (creep) => {
                    // Countdown to death!
                    if (creep.ticksToLive <= 150 || (creep.ticksToLive < 500 && creep.ticksToLive % 10 === 1) || creep.ticksToLive % 100 === 1) {
                        switch (creep.ticksToLive - 1) {
                            case 3:
                                creep.say("R.I.P. and", true);
                                break;
                            case 2:
                                creep.say("Pepperonis", true);
                                break;
                            case 1:
                                creep.say(":(", true);
                                console.log("  RIP & Pepperonis, " + creep.name + " :(");
                                break;
                            default:
                                creep.say("TTL " + (creep.ticksToLive - 1).toString());
                                break;
                        }
                    }

                    if (creep.memory.currentTask && Cache.creepTasks[creep.name]) {
                        Cache.creepTasks[creep.name].run(creep);

                        // Purge current task if the creep is in a new room.
                        if (creep.memory.lastRoom && creep.memory.lastRoom !== creep.room.name) {
                            delete creep.memory.currentTask;
                        }
                        creep.memory.lastRoom = creep.room.name;

                        // Purge current task if it is set to.
                        if (creep.memory.completeTask) {
                            delete creep.memory.completeTask;
                            delete creep.memory.currentTask;
                        }

                        // Only serialize if the task wasn't completed.
                        if (creep.memory.currentTask && Cache.creepTasks[creep.name]) {
                            Cache.creepTasks[creep.name].toObj(creep);
                        }
                    } else {
                        // RIP & Pepperonis :(
                        delete creep.memory.currentTask;
                        if (creep.ticksToLive && creep.ticksToLive < 150) {
                            console.log("  RIP & Pepperonis, " + creep.name + " :(");
                            creep.say("R.I.P. :(", true);
                            creep.suicide();
                        }
                    }
                });
                console.log("  CPU: " + Game.cpu.getUsed().toFixed(2) + "/" + Game.cpu.limit + " Bucket: " + Game.cpu.bucket + " Tick: " + Game.time);
            });
        }
    };

profiler.registerObject(main, "main");
profiler.enable();

module.exports = main;
