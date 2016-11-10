var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskRally = require("task.rally"),

    RemoteCollector = {
        checkSpawn: (room, supportRoom) => {
            "use strict";

            var max = 1;

            if (!supportRoom) {
                supportRoom = room;
            }

            // If there are no spawns in the support room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0) {
                return;
            }

            // If we don't have enough remote collectors for this room, spawn one.
            if (_.filter(Cache.creepsInRoom("remotecollector", room), (c) => c.spawning || c.ticksToLive >= 150).length === 0) {
                RemoteCollector.spawn(room, supportRoom);
            }

            if (max > 0) {
                console.log("    Remote Collectors: " + Cache.creepsInRoom("remoteCollector", room).length + "/" + max);
            }
        },
        
        spawn: (room, supportRoom) => {
            "use strict";

            var body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
                spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Fail under 750 energy.
            if (Utilities.getAvailableEnergyInRoom(supportRoom) < 750) {
                return false;
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]), (s) => s.room.name === supportRoom.name ? 0 : 1)[0];
            name = spawnToUse.createCreep(body, undefined, {role: "remoteCollector", home: room.name, supportRoom: supportRoom.name});
            if (spawnToUse.room.name === supportRoom.name) {
                Cache.spawning[spawnToUse.id] = true;
            }

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new remote collector " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("remoteCollector", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to get energy from containers.
            _.forEach(tasks.collectEnergy.cleanupTasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled links.
            if (tasks.fillEnergy.fillLinkTask) {
                _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.supportRoom && c.carry[RESOURCE_ENERGY] && c.carry[RESOURCE_ENERGY] > 0), (creep) => {
                    if (tasks.fillEnergy.fillLinkTask.canAssign(creep)) {
                        creep.say("Link");
                        assigned.push(creep.name);
                    }
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled storage.
            _.forEach([].concat.apply([], [tasks.fillEnergy.fillStorageTasks, tasks.fillMinerals.fillStorageTasks]), (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce([].concat.apply([], [Utilities.creepsWithTask(Game.creeps, {type: "fillEnergy", id: task.id}), Utilities.creepsWithTask(Game.creeps, {type: "fillMinerals", id: task.id})]), function(sum, c) {return sum + _.sum(c.carry);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Storage");
                            assigned.push(creep.name);
                            energyMissing -= _.sum(creep.carry);
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

            // Check for unfilled containers.
            _.forEach(tasks.fillEnergy.fillContainerTasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce([].concat.apply([], [Utilities.creepsWithTask(Game.creeps, {type: "fillEnergy", id: task.id}), Utilities.creepsWithTask(Game.creeps, {type: "fillMinerals", id: task.id})]), function(sum, c) {return sum + _.sum(c.carry);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Container");
                            assigned.push(creep.name);
                            energyMissing -= _.sum(creep.carry);
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

            // Rally remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                if (_.sum(creep.carry) > 0) {
                    var task = new TaskRally(creep.memory.supportRoom);
                } else {
                    var task = new TaskRally(creep.memory.home);
                }
                task.canAssign(creep);
            });
        }
    };

require("screeps-profiler").registerObject(RemoteCollector, "RoleRemoteCollector");
module.exports = RemoteCollector;
