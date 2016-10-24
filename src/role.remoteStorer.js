var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskRally = require("task.rally"),

    Storer = {
        checkSpawn: (room) => {
            "use strict";

            var length = 0, foundFirstSource = false;
            
            var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
                max = 0;

            // If there are no spawns in the support room, or the room is unobservable, or there are no containers in the room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || Cache.containersInRoom(room).length === 0) {
                return;
            }

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(Cache.containersInRoom(room), (container) => {
                var count = 0,
                    source;

                // If this container is for a mineral, bail if there are no minerals left.  If it's not a mineral, start counter at -1 since it has a worker on it already.
                if ((source = Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(room), Cache.mineralsInRoom(room)]), container)[0]) instanceof Mineral) {
                    if (source.mineralAmount === 0) {
                        return;
                    }
                } else {
                    // If this is the first source, don't count the worker.
                    count = foundFirstSource ? 0 : -1;
                    foundFirstSource = true;
                }

                count += Math.max(Math.ceil(Memory.lengthToContainer[container.id][supportRoom.name] / 22), 0);
                max += count;

                // If we don't have a remote storer for this container, spawn one.
                if (_.filter(Cache.creepsInRoom("remoteStorer", room), (c) => (!c.ticksToLive || c.ticksToLive >= 150) && c.memory.container === container.id).length === 0) {
                    Storer.spawn(room, supportRoom, container.id);
                }
            });

            console.log("    Remote Storers: " + Cache.creepsInRoom("remoteStorer", room).length + "/" + max);
        },
        
        spawn: (room, supportRoom, id) => {
            "use strict";

            var body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
                spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(supportRoom), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Fail under 750 energy.
            if (Utilities.getAvailableEnergyInRoom(supportRoom) < 750) {
                return false;
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(supportRoom), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "remoteStorer", home: room.name, supportRoom: supportRoom.name, container: id});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new remote storer " + name);
                _.forEach(Cache.creepsInRoom("worker", supportRoom), (creep) => {
                    creep.memory.completeTask = true;
                });
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("remoteStorer", room)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled containers.
            _.forEach([].concat.apply([], [tasks.fillEnergy.fillStorageTasks, tasks.fillMinerals.fillStorageTasks]), (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(_.sum(task.object.store)) - _.reduce([].concat.apply([], [Utilities.creepsWithTask(Game.creeps, {type: "fillEnergy", id: task.id}), Utilities.creepsWithTask(Game.creeps, {type: "fillMinerals", id: task.id})]), function(sum, c) {return sum + _.sum(c.carry);}, 0);
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

            // Rally remaining creeps.
            _.forEach(creesWithNoTask, (creep) => {
                var task = new TaskRally(creep.memory.home);
                task.canAssign(creep);
            });
        }
    };

require("screeps-profiler").registerObject(Storer, "RoleRemoteStorer");
module.exports = Storer;
