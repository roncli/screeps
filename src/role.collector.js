var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally");

class Collector {
    static checkSpawn(room) {
        var spawns = Cache.spawnsInRoom(room),
            max = 0,
            roomName = room.name,
            collectors = Cache.creeps[roomName] && Cache.creeps[roomName].collector || [],
            count, sources, capacity, adjustment;
        
        // If there is storage and containers in the room, ignore the room.
        if (Cache.containersInRoom(room).length !== 0 && room.storage && room.storage.my) {
            return;
        }

        // If there are no spawns in the room, ignore the room.
        if (spawns.length === 0) {
            return;
        }

        // If there is only one energy source, ignore the room.
        sources = Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0]);
        if (sources.length <= 1) {
            return;
        }

        // Determine the max creep adjustment to use.
        adjustment = Math.max((2500 - room.energyCapacityAvailable) / 2500, 0.1);

        //  Loop through sources to see if we have anything we need to spawn.
        _.forEach(sources, (source, index) => {
            var sourceId = source.id;
            
            // Skip the first index.
            if (index === 0) {
                return;
            }

            max += Math.ceil(3 * adjustment);

            // If we have less than max collectors, spawn a collector.
            count = _.filter(collectors, (c) => c.memory.homeSource === sourceId).length;
            if (count < 3 * adjustment) {
                Collector.spawn(room, sourceId);
            }
        });

        // Output collector count in the report.
        if (Memory.log && (collectors.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "collector",
                count: collectors.length,
                max: max
            });
        }        
    }

    static spawn(room, id) {
        var body = [],
            roomName = room.name,
            energy, units, remainder, count, spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Get the total energy in the room, limited to 3300.
        energy = Math.min(room.energyCapacityAvailable, 3300);
        units = Math.floor(energy / 200);
        remainder = energy % 200;

        // Create the body based on the energy.
        for (count = 0; count < units; count++) {
            body.push(WORK);
        }

        if (remainder >= 150) {
            body.push(WORK);
        }

        for (count = 0; count < units; count++) {
            body.push(CARRY);
        }

        if (remainder >= 100 && remainder < 150) {
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        if (remainder >= 50) {
            body.push(MOVE);
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === room.memory.region).sort((a, b) => (a.room.name === roomName ? 0 : 1) - (b.room.name === roomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `collector-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "collector", home: roomName, homeSource: id});
        if (spawnToUse.room.name === roomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].collector || []), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
            allCreeps = Cache.creeps[roomName] && Cache.creeps[roomName].all || [],
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for critical controllers to upgrade.
        _.forEach(tasks.upgradeController.criticalTasks, (task) => {
            if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "upgradeController" && c.memory.currentTask.room === task.room).length === 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, room.controller), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("CritCntrlr");
                        assigned.push(creep.name);
                        return false;
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled extensions.
        _.forEach(creepsWithNoTask, (creep) => {
            // Don't bother if the creep doesn't have enough energy.
            if (creep.carry[RESOURCE_ENERGY] < (room.controller.level === 8 ? 200 : room.controller.level === 7 ? 100 : 50)) {
                return;
            }
            
            _.forEach(tasks.fillEnergy.extensionTasks.sort((a, b) => a.object.pos.getRangeTo(creep) - b.object.pos.getRangeTo(creep)), (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    if (task.canAssign(creep)) {
                        creep.say("Extension");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
        });
        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled spawns.
        _.forEach(tasks.fillEnergy.spawnTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Spawn");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled towers.
        _.forEach(tasks.fillEnergy.towerTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Tower");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });
        
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for critical repairs.
        _.forEach(tasks.repair.criticalTasks, (task) => {
            _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                if (_.filter(Cache.creeps[task.structure.room.name] && Cache.creeps[task.structure.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                    if (task.canAssign(creep)) {
                        creep.say("CritRepair");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for construction sites.
        _.forEach(tasks.build.tasks, (task) => {
            var progressMissing = task.constructionSite.progressTotal - task.constructionSite.progress - _.reduce(_.filter(Cache.creeps[task.constructionSite.room.name] && Cache.creeps[task.constructionSite.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
            if (progressMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.constructionSite), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                        assigned.push(creep.name);
                        progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (progressMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for repairs.
        _.forEach(tasks.repair.tasks, (task) => {
            var hitsMissing = task.structure.hitsMax - task.structure.hits - _.reduce(_.filter(Cache.creeps[task.structure.room.name] && Cache.creeps[task.structure.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0) * 100,
                taskAssigned = false;

            if (hitsMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Repair");
                        assigned.push(creep.name);
                        hitsMissing -= (creep.carry[RESOURCE_ENERGY] || 0) * 100;
                        taskAssigned = true;
                        if (hitsMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
            
            return taskAssigned;
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for controllers to upgrade.
        _.forEach(tasks.upgradeController.tasks, (task) => {
            _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, room.controller), (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Controller");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room if there are no hostiles.
        if (Cache.hostilesInRoom(room).length === 0) {
            _.forEach(creepsWithNoTask, (creep) => {
                _.forEach(TaskPickupResource.getCollectorTasks(creep.room), (task) => {
                    if (_.filter(Cache.creeps[task.resource.room.name] && Cache.creeps[task.resource.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                        return;
                    }
                    if (task.canAssign(creep)) {
                        creep.say("Pickup");
                        assigned.push(creep.name);
                        return false;
                    }
                });
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get energy from containers.
        _.forEach(tasks.collectEnergy.tasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign harvest task to remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskHarvest();
            if (task.canAssign(creep)) {
                creep.say("Harvesting");
                assigned.push(creep.name);
            }
        });
        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        _.forEach(TaskRally.getHarvesterTasks(creepsWithNoTask), (task) => {
            task.canAssign(task.creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Collector, "RoleCollector");
}
module.exports = Collector;
