var profiler = require("screeps-profiler"),
    Cache = require("cache"),
    Utilities = require("utilities"),
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
    
    main = {
        loop: () => {
            "use strict";

            profiler.wrap(() => {
                // Reset the cache.
                Cache.reset();

                // Export global objects to Game.cmd for use from console.
                Game.cmd = {
                    Cache: Cache,
                    Role: {
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

                // Log date & GCL.
                console.log(new Date());
                console.log("  Global level " + Game.gcl.level + " " + Game.gcl.progress + "/" + Game.gcl.progressTotal + " " + (100 * Game.gcl.progress / Game.gcl.progressTotal).toFixed(3) + "%");

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

                // Loop through each room to determine the required tasks for the room.
                _.forEach(Game.rooms, (room) => {
                    console.log("  " + room.name + " Status");
                    
                    // Manage room every 100 turns.
                    if (Game.time % 100 === 0 && Memory.rooms && Memory.rooms[room.name] === "base") {
                        RoomBase.manage(room);
                        console.log("    Room managed");
                    }

                    // Update controller.
                    if (room.controller) {
                        if (room.controller.my) {
                            if (room.controller.level === 8) {
                                console.log("    Controller level " + room.controller.level);
                            } else {
                                console.log("    Controller level " + room.controller.level + " " + room.controller.progress + "/" + room.controller.progressTotal + " " + (100 * room.controller.progress / room.controller.progressTotal).toFixed(3) + "%");
                            }
                        } else if (room.controller.level === 0) {
                            console.log("    Controller unowned");
                        } else {
                            console.log("    Controller level " + room.controller.level + " owned by " + room.controller.owner.username);
                        }
                    }
                    
                    // Spawn new creeps.
                    RoleWorker.checkSpawn(room);
                    RoleRangedAttack.checkSpawn(room);
                    RoleHealer.checkSpawn(room);
                    RoleMiner.checkSpawn(room);
                    RoleStorer.checkSpawn(room);
                    RoleCollector.checkSpawn(room);
                    RoleDelivery.checkSpawn(room);

                    // Assign tasks to creeps.                    
                    RoleWorker.assignTasks(room);
                    RoleRangedAttack.assignTasks(room);
                    RoleHealer.assignTasks(room);
                    RoleMiner.assignTasks(room);
                    RoleStorer.assignTasks(room);
                    RoleCollector.assignTasks(room);
                    RoleDelivery.assignTasks(room);

                    // Assign tasks to towers.
                    RoleTower.assignTasks(room);
                });
                
                // Loop through each creep to run its current task, prioritizing most energy being carried first, and then serialize it.
                _.forEach(Game.creeps, (creep) => {
                    // Countdown to death!
                    if (creep.ticksToLive <= 150 || (creep.ticksToLive < 500 && creep.ticksToLive % 10 === 1) || creep.ticksToLive % 100 === 1) {
                        creep.say("TTL " + (creep.ticksToLive - 1).toString());
                    }

                    if (creep.memory.currentTask && Cache.creepTasks[creep.name]) {
                        Cache.creepTasks[creep.name].run(creep);
                        // Only serialize if the task wasn't completed.
                        if (creep.memory.currentTask && Cache.creepTasks[creep.name]) {
                            Cache.creepTasks[creep.name].toObj(creep);
                        }
                    } else {
                        // RIP & Pepperonis :(
                        delete creep.memory.currentTask;
                        if (creep.ticksToLive && creep.ticksToLive < 150) {
                            console.log("  RIP & Pepperonis, " + creep.name + " :(");
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
