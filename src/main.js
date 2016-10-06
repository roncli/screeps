var profiler = require("screeps-profiler"),
    Cache = require("cache"),
    RoleHealer = require("role.healer"),
    RoleWorker = require("role.worker"),
    taskDeserialization = require("taskDeserialization"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    
    main = {
        loop: () => {
            profiler.wrap(() => {
                var towerFired = false,
                    name, count, creep, room, tasks, creepTasks, closestCreeps;

                // Reset the cache.
                Cache.reset();

                // Export global objects to Game.cmd for use from console.
                Game.cmd = {
                    Cache: Cache,
                    Worker: RoleWorker
                };

                // Log date.
                console.log(new Date());

                // Clear old memory.
                for (name in Memory.creeps) {
                    if (!Game.creeps[name]) {
                        delete Memory.creeps[name];
                    }
                }
                
                // Spawn new ranged attackers.
                count = _.filter(Game.creeps, (creep) => creep.memory.role === "rangedAttack").length;
                if (count < Memory.maxCreeps.rangedAttack) {
                    name = Game.spawns["Spawn1"].createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK], undefined, {role: "rangedAttack"});
                    if (typeof name !== "number") {
                        console.log("Spawning new ranged attacker " + name);
                    }
                }
                console.log("Ranged Attackers: " + count.toString() + "/" + Memory.maxCreeps.rangedAttack.toString());
                
                creepTasks = {};
                
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
                    console.log(room.name + " Status");
                    
                    // Update controller.
                    if (room.controller) {
                        console.log("Controller level " + room.controller.level + " " + room.controller.progress + "/" + room.controller.progressTotal + " " + (100 * room.controller.progress / room.controller.progressTotal).toFixed(3) + "%");
                    }
                    
                    // Spawn new creeps.
                    RoleWorker.checkSpawn(room);
                    //RoleRangedAttack.checkSpawn(room);
                    RoleHealer.checkSpawn(room);
                    
                    RoleWorker.assignTasks(room, creepTasks);
                    //RoleRangedAttack.assignTasks(room, creepTasks);
                    RoleHealer.assignTasks(room, creepTasks);
                    
                    // Find enemies to attack.
                    if (Cache.hostilesInRoom(room).length > 0) {
                        targets = _.sortBy(Cache.hostilesInRoom(room), (t) => t.hits);

                        // Kill with tower if possible.
                        _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                            tower.attack(targets[0]);
                        });

                        console.log("Targets to kill: " + targets.length);
                        _.forEach(_.filter(Cache.creepsInRoom("all", room), (c) => c.memory.role === "rangedAttack" && (!c.memory.currentTask || c.memory.currentTask.type === "rally")), (creep) => {
                            task = new TaskRangedAttack(targets[0].id);
                            if (task.canAssign(creep, creepTasks)) {
                                creep.say("Die!", true);
                            }
                        });
                    }
                    
                    // Rally the troops!
                    _.forEach(_.filter(Cache.creepsInRoom("all", room), (c) => c.memory.role == "rangedAttack" && (!c.memory.currentTask || c.memory.currentTask.type === "rally")), (creep) => {
                        task = new TaskRally("rallyPoint");
                        task.canAssign(creep, creepTasks);
                    });
                });
                
                // Loop through each creep to run its current task, prioritizing most energy being carried first, and then serialize it.
                _.forEach(Game.creeps, (creep) => {
                    // Countdown to death!
                    if (creep.ticksToLive <= 150 || (creep.ticksToLive < 500 && creep.ticksToLive % 10 === 1) || creep.ticksToLive % 100 === 1) {
                        creep.say("TTL " + (creep.ticksToLive - 1).toString());
                    }

                    if (creep.memory.currentTask) {
                        creepTasks[creep.name].run(creep);
                        creepTasks[creep.name].toObj(creep);
                    } else {
                        // RIP & Pepperonis :(
                        delete creep.memory.currentTask;
                        if (creep.ticksToLive && creep.ticksToLive < 150) {
                            console.log("RIP & Pepperonis, " + creep.name + " :(");
                            creep.suicide();
                        }
                    }
                });
                console.log("--------------------");
            });
        }
    };

profiler.enable();

module.exports = main;
