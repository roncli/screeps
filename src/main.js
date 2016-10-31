require("screeps-perf")({
    optimizePathFinding: false
});

var profiler = require("screeps-profiler"),
    Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleHealer = require("role.healer"),
    RoleMeleeAttack = require("role.meleeAttack"),
    RoleMiner = require("role.miner"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleRemoteBuilder = require("role.remoteBuilder"),
    RoleRemoteMiner = require("role.remoteMiner"),
    RoleRemoteReserver = require("role.remoteReserver"),
    RoleRemoteStorer = require("role.remoteStorer"),
    RoleRemoteWorker = require("role.remoteWorker"),
    RoleStorer = require("role.storer"),
    RoleTower = require("role.tower"),
    RoleWorker = require("role.worker"),
    RoomBase = require("room.base"),
    RoomMine = require("room.mine"),
    taskDeserialization = require("taskDeserialization"),
    roomDeserialization = require("roomDeserialization"),
    
    main = {
        loop: () => {
            "use strict";

            profiler.wrap(() => {
                var unobservableRooms = [];

                // Reset the cache.
                Cache.reset();

                // Export global objects to Game.cmd for use from console.
                Game.cmd = {
                    Cache: Cache,
                    Commands: Commands,
                    Role: {
                        Claimer: RoleClaimer,
                        Collector: RoleCollector,
                        Defender: RoleDefender,
                        Healer: RoleHealer,
                        MeleeAttack: RoleMeleeAttack,
                        Miner: RoleMiner,
                        RangedAttack: RoleRangedAttack,
                        RemoteBuilder: RoleRemoteBuilder,
                        RemoteMiner: RoleRemoteMiner,
                        RemoteReserver: RoleRemoteReserver,
                        RemoteStorer: RoleRemoteStorer,
                        RemoteWorker: RoleRemoteWorker,
                        Storer: RoleStorer,
                        Tower: RoleTower,
                        Worker: RoleWorker
                    },
                    Room: {
                        Base: RoomBase,
                        Mine: RoomMine
                    },
                    Utilities: Utilities
                };
                
                // Initialize max creeps.
                if (!Memory.maxCreeps) {
                    Memory.maxCreeps = {};
                }

                // Log date, GCL, and credits.
                console.log(new Date());
                console.log("GCL " + Game.gcl.level + " " + Game.gcl.progress + "/" + Game.gcl.progressTotal.toFixed(0) + " " + (100 * Game.gcl.progress / Game.gcl.progressTotal).toFixed(3) + "% " + (Game.gcl.progressTotal - Game.gcl.progress).toFixed(0) + " to go");
                console.log("Credits: " + Game.market.credits.toFixed(2));

                // Clear old memory.
                _.forEach(Memory.creeps, (creep, name) => {
                    if (!Game.creeps[name]) {
                        delete Memory.creeps[name];
                    }
                });
                _.forEach(Memory.lengthToContainer, (value, id) => {
                    if (!Cache.getObjectById(id)) {
                        delete Memory.lengthToContainer[id];
                    }
                });
                _.forEach(Memory.lengthToController, (value, id) => {
                    if (!Cache.getObjectById(id)) {
                        delete Memory.lengthToController[id];
                    }
                });
                _.forEach(Memory.lengthToLink, (value, id) => {
                    if (!Cache.getObjectById(id)) {
                        delete Memory.lengthToLink[id];
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

                // Loop through each room in memory to deserialize their type and find rooms that aren't observable.
                _.forEach(Memory.rooms, (roomMemory, name) => {
                    if (name === "undefined") {
                        return;
                    }
                    if (roomMemory && roomMemory.roomType) {
                        roomDeserialization(roomMemory, name);
                    }
                    if (!Game.rooms[name]) {
                        unobservableRooms.push({
                            name: name,
                            unobservable: true
                        });
                    }
                });

                // Loop through each room to determine the required tasks for the room, and then serialize the room.
                _.forEach(_.sortBy([].concat.apply([], [_.filter(Game.rooms), unobservableRooms]), (r) => Memory.rooms[r.name] && Memory.rooms[r.name].roomType ? ["base", "mine"].indexOf(Memory.rooms[r.name].roomType.type) : 9999), (room) => {
                    var type = Memory.rooms[room.name] && Memory.rooms[room.name].roomType && Memory.rooms[room.name].roomType.type ? Memory.rooms[room.name].roomType.type : "unknown";

                    if (room.unobservable) {
                        // Log room status.
                        console.log("  " + type + " " + room.name + " Unobservable");
                    } else {
                        // Log room status.
                        if (room.controller) {
                            if (room.controller.my) {
                                if (room.controller.level === 8) {
                                    console.log("  " + type + " " + room.name + " RCL " + room.controller.level);
                                } else {
                                    console.log("  " + type + " " + room.name + " RCL " + room.controller.level + " " + room.controller.progress + "/" + room.controller.progressTotal + " " + (100 * room.controller.progress / room.controller.progressTotal).toFixed(3) + "% " + (room.controller.progressTotal - room.controller.progress) + " to go");
                                }
                            } else if (room.controller.level === 0) {
                                if (room.controller.reservation) {
                                    console.log("  " + type + " " + room.name + " Controller reserved " + room.controller.reservation.username + " TTE " + room.controller.reservation.ticksToEnd);
                                } else {
                                    console.log("  " + type + " " + room.name + " Controller unowned");
                                }
                            } else {
                                console.log("  " + type + " " + room.name + " RCL " + room.controller.level + " owned by " + room.controller.owner.username);
                            }
                        } else {
                            console.log("  " + type + " " + room.name);
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
                    }

                    if (Cache.roomTypes[room.name]) {
                        Cache.roomTypes[room.name].run(room);
                        Cache.roomTypes[room.name].toObj(room);
                    }
                });
                
                // Loop through each creep to run its current task, prioritizing most energy being carried first, and then serialize it.
                _.forEach(Game.creeps, (creep) => {
                    // Don't do anything if the creep is spawning or stopped.
                    if (creep.spawning || creep.memory.stop) {
                        return;
                    }

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

                    // Happy new million!
                    switch (Game.time % 1000000) {
                        case 999990:
                            creep.say("TEN!", true);
                            break;
                        case 999991:
                            creep.say("NINE!", true);
                            break;
                        case 999992:
                            creep.say("EIGHT!", true);
                            break;
                        case 999993:
                            creep.say("SEVEN!", true);
                            break;
                        case 999994:
                            creep.say("SIX!", true);
                            break;
                        case 999995:
                            creep.say("FIVE!", true);
                            break;
                        case 999996:
                            creep.say("FOUR!", true);
                            break;
                        case 999997:
                            creep.say("THREE!", true);
                            break;
                        case 999998:
                            creep.say("TWO!", true);
                            break;
                        case 999999:
                            creep.say("ONE!", true);
                            break;
                        case 0:
                            creep.say("HAPPY NEW", true);
                            break;
                        case 1:
                            creep.say("MILLION!", true);
                            break;
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
                        if (!creep.spawning && creep.ticksToLive < 150) {
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
