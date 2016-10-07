var profiler = require("screeps-profiler"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    RoleCollector = require("role.collector"),
    RoleHealer = require("role.healer"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleWorker = require("role.worker"),
    taskDeserialization = require("taskDeserialization"),
    
    main = {
        loop: () => {
            profiler.wrap(() => {
                var creepTasks = {};

                // Reset the cache.
                Cache.reset();

                // Export global objects to Game.cmd for use from console.
                Game.cmd = {
                    Cache: Cache,
                    Collector: RoleCollector,
                    Healer: RoleHealer,
                    RangedAttack: RoleRangedAttack,
                    Utilities: Utilities,
                    Worker: RoleWorker
                };

                // Log date.
                console.log(new Date());

                // Clear old memory.
                _.forEach(Memory.creeps, (creep, name) => {
                    if (!Game.creeps[name]) {
                        delete Memory.creeps[name];
                    }
                });
                
                // Loop through each creep to deserialize their task and see if it is completed.
                _.forEach(Game.creeps, (creep) => {
                    if (creep.memory.currentTask) {
                        taskDeserialization(creep, creepTasks);
                        if (creepTasks[creep.name]) {
                            creepTasks[creep.name].canComplete(creep);
                        }
                    }
                });

                // Loop through each room to determine the required tasks for the room.
                _.forEach(_.uniq(_.map(Game.creeps, (creep) => creep.room)), (room) => {
                    console.log("  " + room.name + " Status");
                    
                    // Update controller.
                    if (room.controller) {
                        console.log("    Controller level " + room.controller.level + " " + room.controller.progress + "/" + room.controller.progressTotal + " " + (100 * room.controller.progress / room.controller.progressTotal).toFixed(3) + "%");
                    }
                    
                    // Spawn new creeps.
                    RoleWorker.checkSpawn(room);
                    RoleCollector.checkSpawn(room);
                    RoleRangedAttack.checkSpawn(room);
                    RoleHealer.checkSpawn(room);
                    
                    RoleWorker.assignTasks(room, creepTasks);
                    RoleCollector.assignTasks(room, creepTasks);
                    RoleRangedAttack.assignTasks(room, creepTasks);
                    RoleHealer.assignTasks(room, creepTasks);
                });
                
                // Loop through each creep to run its current task, prioritizing most energy being carried first, and then serialize it.
                _.forEach(Game.creeps, (creep) => {
                    // Countdown to death!
                    if (creep.ticksToLive <= 150 || (creep.ticksToLive < 500 && creep.ticksToLive % 10 === 1) || creep.ticksToLive % 100 === 1) {
                        creep.say("TTL " + (creep.ticksToLive - 1).toString());
                    }

                    if (creep.memory.currentTask && creepTasks[creep.name]) {
                        creepTasks[creep.name].run(creep);
                        creepTasks[creep.name].toObj(creep);
                    } else {
                        // RIP & Pepperonis :(
                        delete creep.memory.currentTask;
                        if (creep.ticksToLive && creep.ticksToLive < 150) {
                            console.log("  RIP & Pepperonis, " + creep.name + " :(");
                            creep.suicide();
                        }
                    }
                });
                console.log("  CPU: " + Game.cpu.getUsed().toFixed(2) + "/" + Game.cpu.limit);
                console.log("  Bucket: " + Game.cpu.bucket);
            });
        }
    };

profiler.enable();

module.exports = main;
