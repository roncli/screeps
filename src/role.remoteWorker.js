var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),

    Worker = {
        checkSpawn: (room) => {
            "use strict";

            var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
                max = 0;

            // If there are no spawns in the support room, or the room is unobservable, or there are no containers in the room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || Cache.containersInRoom(room).length === 0) {
                return;
            }

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(Cache.containersInRoom(room), (container) => {
                var source;

                // If this container is for a mineral, skip it.
                if ((source = Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(room), Cache.mineralsInRoom(room)]), container)[0]) instanceof Mineral) {
                    return;
                }

                max += 1;

                // If we don't have a remote worker for this container, spawn one.
                if (_.filter(Cache.creepsInRoom("remoteWorker", room), (c) => (c.spawning || c.ticksToLive >= 150 + Memory.lengthToContainer[container.id][supportRoom.name]) && c.memory.container === container.id).length === 0) {
                    Worker.spawn(room, supportRoom, container.id);
                }

                // Only 1 worker per room.
                return false;
            });

            // Output remote worker count in the report.
            if (max > 0) {
                console.log("    Remote Workers: " + Cache.creepsInRoom("remoteWorker", room).length + "/" + max);
            }        
        },
        
        spawn: (room, supportRoom, id) => {
            "use strict";

            var body = [],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(supportRoom), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 3300.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(supportRoom), 3300);

            // If we're not at 3300 and energy is not at capacity, bail.
            if (energy < 3300 && energy !== Utilities.getEnergyCapacityInRoom(supportRoom)) {
                return;
            }

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(WORK);
            }

            if (energy % 200 >= 150) {
                body.push(WORK);
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(CARRY);
            }

            if (energy % 200 >= 100 && energy % 200 < 150) {
                body.push(CARRY);
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(MOVE);
            }

            if (energy % 200 >= 50) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(supportRoom), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "remoteWorker", home: room.name, supportRoom: supportRoom.name, container: id});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new remote worker " + name);
                _.forEach(Cache.creepsInRoom("worker", supportRoom), (creep) => {
                    creep.memory.completeTask = true;
                });
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("remoteWorker", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check critical repairs if we're in the home room.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.home), (creep) => {
                _.forEach(tasks.repair.criticalTasks, (task) => {
                    if (Utilities.creepsWithTask(Game.creeps, {type: "repair", id: task.id}).length === 0) {
                        if (task.canAssign(creep)) {
                            creep.say("CritRepair");
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

            // Check for construction sites.
            _.forEach(creepsWithNoTask, (creep) => {
                if (Cache.constructionSitesInRoom(creep.room).length > 0) {
                    var task = new TaskBuild(Cache.constructionSitesInRoom(creep.room)[0].id);
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                        assigned.push(creep.name);
                    }
                }
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

            // Check for unfilled containers.
            _.forEach([].concat.apply([], [tasks.fillEnergy.fillStorageTasks, tasks.fillMinerals.fillStorageTasks, tasks.fillEnergy.fillContainerTasks]), (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(_.sum(task.object.store)) - _.reduce([].concat.apply([], [Utilities.creepsWithTask(Game.creeps, {type: "fillEnergy", id: task.id}), Utilities.creepsWithTask(Game.creeps, {type: "fillMinerals", id: task.id})]), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Container");
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

            // Check for dropped resources in current room.
            _.forEach(creepsWithNoTask, (creep) => {
                _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                    if (_.filter(Game.creeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                        return;
                    }
                    if (task.canAssign(creep)) {
                        creep.say("Pickup");
                        assigned.push(creep.name);
                        return false;
                    }
                });
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to get energy from containers.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskCollectEnergy(creep.memory.container);

                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to assign harvest task to remaining creeps.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskHarvest(),
                        sources = Utilities.objectsClosestToObj(_.filter(Cache.energySourcesInRoom(room), (s) => s.energy > 0), creep);
                    
                    if (sources.length === 0) {
                        return false;
                    }

                    creep.memory.homeSource = sources[0].id;

                    if (task.canAssign(creep)) {
                        creep.say("Harvesting");
                        assigned.push(creep.name);
                    }
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Rally remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskRally(creep.memory.home);
                task.canAssign(creep);
            });
        }
    };

require("screeps-profiler").registerObject(Worker, "RoleRemoteWorker");
module.exports = Worker;
