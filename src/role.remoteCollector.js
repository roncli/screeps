var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally");

class RemoteCollector {
    static checkSpawn(room, supportRoom, max) {
        var roomName = room.name,
            creeps = Cache.creeps[roomName],
            collectors = creeps && creeps.remoteCollector || [];

        if (!supportRoom) {
            supportRoom = room;
        }

        if (!max) {
            max = room.memory.roomType && room.memory.roomType.type === "cleanup" ? (supportRoom.controller ? supportRoom.controller.level : 3) : 1;
        }

        // If there are no spawns in the support room, ignore the room.
        if (Cache.spawnsInRoom(supportRoom).length === 0) {
            return;
        }

        // If we don't have enough remote collectors for this room, spawn one.
        if (_.filter(collectors, (c) => c.spawning || c.ticksToLive >= 300).length < max) {
            RemoteCollector.spawn(room, supportRoom);
        }

        if (Memory.log && (collectors.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteCollector",
                count: collectors.length,
                max: max
            });
        }
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, spawnToUse, name, count;

        // Fail if all the spawns are busy.
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Get the total energy in the support room, limited to 2400.
        energy = Math.min(supportRoom.energyCapacityAvailable, 2400);
        units = Math.floor(energy / 150);

        // Create the body based on the energy.
        for (count = 0; count < units; count++) {
            body.push(CARRY);
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteCollector-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteCollector", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creeps = Cache.creeps[roomName],
            creepsWithNoTask = Utilities.creepsWithNoTask(creeps && creeps.remoteCollector || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room.
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                if (_.sum(creeps && creeps.all || [], (c) => c.memory.currentTask && c.memory.currentTask.id === task.idG ? c.carryCapacity - _.sum(c.carry) : 0) >= task.resource.amount) {
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

        // Attempt to get minerals from containers.
        if (tasks.collectMinerals && tasks.collectMinerals.cleanupTasks) {
            _.forEach(tasks.collectMinerals.cleanupTasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];

                if (creepsWithNoTask.length === 0) {
                    return;
                }
            });
        }

        if (tasks.collectEnergy && tasks.collectEnergy.cleanupTasks) {
            // Attempt to get energy from containers.
            _.forEach(tasks.collectEnergy.cleanupTasks, (task) => {
                _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];

                if (creepsWithNoTask.length === 0) {
                    return;
                }
            });
        }

        // Check for unfilled storage.
        _.forEach(tasks.fillEnergy.storageTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
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

        // Check for unfilled storage for minerals.
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled terminals for minerals.
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled containers.
        _.forEach(tasks.fillEnergy.containerTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
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
            var task;
            
            if (_.sum(creep.carry) > 0) {
                task = new TaskRally(creep.memory.supportRoom);
            } else {
                task = new TaskRally(creep.memory.home);
            }
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RemoteCollector, "RoleRemoteCollector");
}
module.exports = RemoteCollector;
