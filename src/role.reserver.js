var Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskReserve = require("task.reserve"),

    Reserver = {
        checkSpawn: (room) => {
            "use strict";

            var num = 0, max = 0;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // Loop through the room reservers to see if we need to spawn a creep.
            if (Memory.maxCreeps.reserver) {
                _.forEach(Memory.maxCreeps.reserver[room.name], (value, toRoom) => {
                    var count = _.filter(Game.creeps, (c) => c.memory.role === "reserver" && c.memory.home === room.name && c.memory.reserve === toRoom).length;

                    num += count;
                    max += 1;

                    if (count === 0) {
                        Reserver.spawn(room, toRoom);
                    }
                });
            }

            // Output reserver count in the report.
            if (max > 0) {
                console.log("    Reservers: " + num + "/" + max);
            }        
        },
        
        spawn: (room, toRoom) => {
            "use strict";

            var body = [],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 16250.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(room), 16250);

            // If we're not at 16250 and energy is not at capacity, bail.
            if (energy < 16250 && energy !== Utilities.getEnergyCapacityInRoom(room)) {
                return;
            }

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(CLAIM);
            }

            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "reserver", home: room.name, reserve: toRoom});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new reserver " + name);
                _.forEach(Cache.creepsInRoom("worker", room), (creep) => {
                    creep.memory.completeTask = true;
                });
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "reserver" && c.memory.home === room.name && !c.memory.currentTask)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If the creeps are not in the room, rally them.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.reserve), (creep) => {
                var task = TaskRally.getReserverTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If we have claimed the controller, stop trying to reserve the room and suicide any remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                if (creep.room.name === creep.memory.reserve && creep.room.controller.my) {
                    assigned.push(creep.name);
                    Commands.reserveRoom(creep.memory.home, creep.room.name, false);
                    creep.suicide();
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Reserve the controller.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskReserve.getTask(creep);
                if (task.canAssign(creep)) {
                    creep.say("Reserving");
                    assigned.push(creep.name);
                };
            });
        }
    };

require("screeps-profiler").registerObject(Reserver, "RoleReserver");
module.exports = Reserver;
