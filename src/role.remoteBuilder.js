var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair"),

    Builder = {
        checkSpawn: (room) => {
            "use strict";

            var roomName = room.name,
                supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
                max = 1,
                num;

            // If there are no spawns in the support room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0) {
                return;
            }

            // If we don't find a remote builder, spawn a new remote builder.
            if ((num = (Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || []).length) < max) {
                Builder.spawn(room, supportRoom);
            }

            // Output remote builder count in the report.
            if (Memory.log && (num > 0 || max > 0)) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "remoteBuilder",
                    count: num,
                    max: max
                });
            }
        },
        
        spawn: (room, supportRoom) => {
            "use strict";

            var body = [],
                roomName = room.name,
                supportRoomName = supportRoom.name,
                energy, units, remainder, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 3300.
            energy = Math.min(supportRoom.energyCapacityAvailable, 3300);
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
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "remoteBuilder-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "remoteBuilder", home: roomName, supportRoom: supportRoomName});
            if (spawnToUse.room.name === supportRoomName) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
            }

            return typeof name !== "number";
        },

        assignTasks: (room) => {
            "use strict";

            var roomName = room.name,
                creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for enemy construction sites and rally to them.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === room.name), (creep) => {
                if (room.find(FIND_HOSTILE_CONSTRUCTION_SITES).length > 0) {
                    var task = new TaskRally(room.find(FIND_HOSTILE_CONSTRUCTION_SITES)[0].id);
                    task.canAssign(creep);
                    creep.say("Stomping");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check critical repairs.
            _.forEach(creepsWithNoTask, (creep) => {
                _.forEach(TaskRepair.getCriticalTasks(creep.room), (task) => {
                    if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
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
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
                    if (constructionSites.length > 0) {
                        var task = new TaskBuild(Utilities.objectsClosestToObj(constructionSites, creep)[0].id);
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
            }
            
            // Check for dropped resources in current room.
            _.forEach(creepsWithNoTask, (creep) => {
                if (creep.room === creep.memory.home) {
                    _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                        if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                            return;
                        }
                        if (task.canAssign(creep)) {
                            creep.say("Pickup");
                            assigned.push(creep.name);
                            return false;
                        }
                    });
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to assign harvest task to remaining creeps.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskHarvest(),
                        sources = Utilities.objectsClosestToObj(_.filter(room.find(FIND_SOURCES), (s) => s.energy > 0), creep);
                    
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

require("screeps-profiler").registerObject(Builder, "RoleRemoteBuilder");
module.exports = Builder;
