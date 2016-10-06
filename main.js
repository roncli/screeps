var profiler = require("screeps-profiler"),
    TaskBuild = require("task.build"),
    TaskFillExtension = require("task.fillExtension"),
    TaskFillSpawn = require("task.fillSpawn"),
    TaskFillTower = require("task.fillTower"),
    TaskHarvest = require("task.harvest"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),
    
    getClosestCreepsToObj = (creeps, obj) => {
        if (creeps.length === 0) {
            return null;
        }
        
        var creepList = _.map(creeps, (creep) => {
            return {
                name: creep.name,
                distance: obj.pos.getRangeTo(creep)
            };
        });
        
        creepList.sort((a, b) => {
            return a.distance - b.distance;
        });
        
        return creepList;
    },
    
    main = {
        loop: () => {
profiler.wrap(() => {
            var towerFired = false,
                name, count, creep, room, roomCreeps, creepTasks, closestCreeps, hostiles;
            console.log(new Date());

            // Clear old memory.
            for (name in Memory.creeps) {
                if (!Game.creeps[name]) {
                    delete Memory.creeps[name];
                    // Debugging: Memory cleaned up for "name"
                }
            }
            
            // Spawn new healers.
            count = _.filter(Game.creeps, (creep) => creep.memory.role === "healer").length;
            if (count < Memory.maxCreeps.healer) {
                name = Game.spawns["Spawn1"].createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, HEAL], undefined, {role: "healer"});
                if (typeof name !== "number") {
                    console.log("Spawning new healer " + name);
                }
            }
            console.log("Healers: " + count.toString() + "/" + Memory.maxCreeps.healer.toString());
            
            // Spawn new ranged attackers.
            count = _.filter(Game.creeps, (creep) => creep.memory.role === "rangedAttack").length;
            if (count < Memory.maxCreeps.rangedAttack) {
                name = Game.spawns["Spawn1"].createCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK], undefined, {role: "rangedAttack"});
                if (typeof name !== "number") {
                    console.log("Spawning new ranged attacker " + name);
                }
            }
            console.log("Ranged Attackers: " + count.toString() + "/" + Memory.maxCreeps.rangedAttack.toString());
            
            // Spawn new workers.
            count = _.filter(Game.creeps, (creep) => creep.memory.role === "worker").length;
            if (count < Memory.maxCreeps.worker) {
                name = Game.spawns["Spawn1"].createCreep([WORK, CARRY, CARRY, MOVE, MOVE], undefined, {role: "worker"});
                if (typeof name !== "number") {
                    console.log("Spawning new worker " + name);
                }
            }
            console.log("Workers: " + count.toString() + "/" + Memory.maxCreeps.worker.toString());
            
            creepTasks = {};
            
            // Loop through each creep to deserialize their task and see if it is completed.
            _.forEach(Game.creeps, (creep) => {
                if (creep.memory.currentTask) {
                    switch (creep.memory.currentTask.type) {
                        case "build":
                            creepTasks[creep.name] = TaskBuild.fromObj(creep);
                            break;
                        case "fillExtension":
                            creepTasks[creep.name] = TaskFillExtension.fromObj(creep);
                            break;
                        case "fillSpawn":
                            creepTasks[creep.name] = TaskFillSpawn.fromObj(creep);
                            break;
                        case "fillTower":
                            creepTasks[creep.name] = TaskFillTower.fromObj(creep);
                            break;
                        case "harvest":
                            creepTasks[creep.name] = TaskHarvest.fromObj(creep);
                            break;
                        case "heal":
                            creepTasks[creep.name] = TaskHeal.fromObj(creep);
                            break;
                        case "rally":
                            creepTasks[creep.name] = TaskRally.fromObj(creep);
                            break;
                        case "rangedAttack":
                            creepTasks[creep.name] = TaskRangedAttack.fromObj(creep);
                            break;
                        case "repair":
                            creepTasks[creep.name] = TaskRepair.fromObj(creep);
                            break;
                        case "upgradeController":
                            creepTasks[creep.name] = TaskUpgradeController.fromObj(creep);
                            break;
                    }
                    creepTasks[creep.name].canComplete(creep);
                }
            });

            // Loop through each room to determine the required tasks.
            _.forEach(_.uniq(_.map(Game.creeps, (creep) => creep.room)), (room) => {
                roomCreeps = room.find(FIND_MY_CREEPS);
                hostiles = room.find(FIND_HOSTILE_CREEPS);

                // Check for controller under 1000.
                if (_.filter(roomCreeps, (creep) => {
                    creep.memory.currentTask && creep.memory.currentTask.type === "upgradeCollector"
                }).length === 0) {
                    targets = room.find(FIND_MY_STRUCTURES, {
                        filter: (structure) => structure.structureType === STRUCTURE_CONTROLLER && structure.ticksToDowngrade < 1000
                    });
                    if (targets.length > 0) {
                        console.log("Collector is critical, refill immediately. TTL: " + targets[0].ticksToDowngrade.toString());
                        task = new TaskUpgradeController();
                        
                        _.forEach(getClosestCreepsToObj(_.filter(roomCreeps, (c) => !c.memory.currentTask), targets[0]), (obj) => {
                            creep = Game.creeps[obj.name];
                            if (task.canAssign(creep, creepTasks)) {
                                creep.say("Controller");
                                return false;
                            }
                        });
                    }
                }
                
                // Check for unfilled extensions.
                targets = room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity && _.filter(roomCreeps, (creep) => creep.memory.currentTask && creep.memory.currentTask.type === "fillExtension" && creep.memory.currentTask.id === structure.id).length === 0
                });
                if (targets.length > 0) {
                    console.log("Unfilled extensions: " + targets.length.toString());
                    _.forEach(targets, (target) => {
                        var assigned = true;
                        
                        task = new TaskFillExtension(target.id);
                        _.forEach(getClosestCreepsToObj(_.filter(roomCreeps, (c) => !c.memory.currentTask), target), (obj) => {
                            creep = Game.creeps[obj.name];
                            if (assigned = task.canAssign(creep, creepTasks)) {
                                creep.say("Extension")
                                return false;
                            }
                        });
                        
                        return assigned;
                    });
                }
                
                // Check for unfilled spawns.
                targets = room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_SPAWN && structure.energy < structure.energyCapacity
                });
                if (targets.length > 0) {
                    console.log("Unfilled spawns: " + targets.length.toString());
                    _.forEach(targets, (target) => {
                        task = new TaskFillSpawn(target.id);
                        _.forEach(getClosestCreepsToObj(_.filter(roomCreeps, (c) => !c.memory.currentTask), target), (obj) => {
                            creep = Game.creeps[obj.name];
                            if (task.canAssign(creep, creepTasks)) {
                                creep.say("Spawn");
                            }
                        });
                    });
                }
                
                // Check for towers under 80%.
                targets = room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_TOWER && structure.energy / structure.energyCapacity < 0.8
                });
                if (targets.length > 0) {
                    console.log("Towers under 80%: " + targets.length.toString());
                    _.forEach(targets, (target) => {
                        var assigned = true;
                        
                        task = new TaskFillTower(target.id);
                        _.forEach(getClosestCreepsToObj(_.filter(roomCreeps, (c) => !c.memory.currentTask), target), (obj) => {
                            creep = Game.creeps[obj.name];
                            if (assigned = task.canAssign(creep, creepTasks)) {
                                creep.say("Tower")
                            }
                        });
                        
                        return assigned;
                    });
                }
                
                // Check for critical repairs.  Anything under 50% AND 100,000 hits is critical.  
                targets = room.find(FIND_STRUCTURES, {
                    filter: (structure) => (structure.my || [STRUCTURE_WALL, STRUCTURE_ROAD].indexOf(structure.structureType) !== -1) && structure.hits < 10000 && structure.hits / structure.hitsMax < 0.5 && _.filter(roomCreeps, (creep) => creep.memory.currentTask && creep.memory.currentTask.type === "repair" && creep.memory.currentTask.id === structure.id).length === 0
                });
                if (targets.length > 0) {
                    targets = _.sortBy(targets, (target) => target.ticksToDecay > 0 ? -10000 + target.hits : target.hits);

                    // Repair with tower if possible.
                    if (hostiles.length === 0) {
                        _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                            towerFired = true;
                            tower.repair(targets[0]);
                        });
                    }

                    console.log("Critical repairs required: " + targets.length.toString());
                    _.forEach(_.take(targets, 5), (target) => {
                        console.log("  " + target.pos.x + "," + target.pos.y + " " + target.hits + "/" + target.hitsMax + " " + (100 * target.hits / target.hitsMax).toFixed(3) + "%");
                    });
/*
                    _.forEach(targets, (target) => {
                        var assigned = true;
                        
                        task = new TaskRepair(target.id);
                        _.forEach(getClosestCreepsToObj(_.filter(roomCreeps, (c) => !c.memory.currentTask), target), (obj) => {
                            creep = Game.creeps[obj.name];
                            if (assigned = task.canAssign(creep, creepTasks)) {
                                creep.say("CritRepair");
                                return false;
                            }
                        });
                        
                        return assigned;
                    });
*/
                }
                
                // Check for construction sites.
                targets = room.find(FIND_MY_CONSTRUCTION_SITES);
                if (targets.length > 0) {
                    console.log("Construction sites: " + targets.length.toString());
                    _.forEach(_.filter(roomCreeps, (c) => !c.memory.currentTask), (creep) => {
                        var closest = creep.pos.findClosestByRange(targets);
                        
                        task = new TaskBuild(closest.id);
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Build");
                        }
                    });
                }

                // Check for repairs.
                targets = room.find(FIND_STRUCTURES, {
                    filter: (structure) => (structure.my || [STRUCTURE_WALL, STRUCTURE_ROAD].indexOf(structure.structureType) !== -1) && structure.hits < structure.hitsMax && _.filter(roomCreeps, (creep) => creep.memory.currentTask && creep.memory.currentTask.type === "repair" && creep.memory.currentTask.id === structure.id).length === 0
                });
                if (targets.length > 0) {
                    targets = _.sortBy(targets, (target) => target.hits / target.hitsMax);
                    
                    // Hit the first target with the towers.
                    if (!towerFired && hostiles.length === 0) {
                        _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                            tower.repair(targets[0]);
                        });
                    }

                    console.log("Repairs required: " + targets.length.toString());
                    _.forEach(_.take(targets, 5), (target) => {
                        console.log("  " + target.pos.x + "," + target.pos.y + " " + target.hits + "/" + target.hitsMax + " " + (100 * target.hits / target.hitsMax).toFixed(3) + "%");
                    });
                    _.forEach(targets, (target) => {
                        var assigned = true;
                        
                        task = new TaskRepair(target.id);
                        _.forEach(getClosestCreepsToObj(_.filter(roomCreeps, (c) => !c.memory.currentTask), target), (obj) => {
                            creep = Game.creeps[obj.name];
                            if (assigned = task.canAssign(creep, creepTasks)) {
                                creep.say("Repair");
                                return false;
                            }
                        });
                        
                        return assigned;
                    });
                }
                
                // Check for controller, and attempt to assign to remaining creeps.
                targets = room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_CONTROLLER
                });
                if (targets.length > 0) {
                    _.forEach(_.filter(roomCreeps, (c) => !c.memory.currentTask), (creep) => {
                        task = new TaskUpgradeController();
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Controller");
                        }
                    });
                }
                
                // Attempt to assign harvest task to remaining creeps.
                _.forEach(_.filter(roomCreeps, (c) => !c.memory.currentTask), (creep) => {
                    task = new TaskHarvest();
                    if (task.canAssign(creep, creepTasks)) {
                        creep.say("Harvesting");
                    }
                });
                
                // Find enemies to attack.
                targets = hostiles;
                if (targets.length > 0) {
                    targets = _.sortBy(targets, (target) => target.hits);

                    // Kill with tower if possible.
                    _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                        tower.attack(targets[0]);
                    });

                    console.log("Targets to kill: " + targets.length);
                    _.forEach(_.filter(roomCreeps, (c) => c.memory.role === "rangedAttack" && (!c.memory.currentTask || c.memory.currentTask.type === "rally")), (creep) => {
                        task = new TaskRangedAttack(targets[0].id);
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Die!", true);
                        }
                    });
                }
                
                // Find allies to heal.
                targets = room.find(FIND_MY_CREEPS, {
                    filter: (target) => target.hits < target.hitsMax && _.filter(roomCreeps, (creep) => creep.memory.currentTask && creep.memory.currentTask.type === "heal" && creep.memory.currentTask.id === target.id).length === 0
                });
                if (targets.length > 0) {
                    console.log("Targets to heal: " + targets.length);
                    targets = _.sortBy(targets, (target) => target.hits / target.hitsMax);

                    _.forEach(targets, (target) => {
                        task = new TaskHeal(target.id);

                        _.forEach(_.filter(roomCreeps, (c) => c.memory.role === "healer" && (!c.memory.currentTask || c.memory.currentTask.type === "rally")), (creep) => {
                            if (task.canAssign(creep, creepTasks)) {
                                creep.say("Healing");
                                return false;
                            }
                        });
                    });
                }

                // Rally the troops!
                _.forEach(_.filter(roomCreeps, (c) => ["rangedAttack", "healer"].indexOf(c.memory.role) !== -1 && (!c.memory.currentTask || c.memory.currentTask.type === "rally")), (creep) => {
                    rangedAttackers = _.filter(roomCreeps, (c) => c.memory.role === "rangedAttack");
                    if (creep.memory.role === "healer" && rangedAttackers.length > 0) {
                        task = new TaskRally(rangedAttackers[0].id);
                    } else {
                        task = new TaskRally("rallyPoint");
                    }
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
