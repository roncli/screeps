var Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskClaim = require("task.claim"),

    Claimer = {
        checkSpawn: (room) => {
            "use strict";

            var num = 0, max = 0;
            
            // Loop through the room claimers to see if we need to spawn a creep.
            if (Memory.maxCreeps.claimer) {
                _.forEach(Memory.maxCreeps.claimer[room.name], (value, toRoom) => {
                    var count = _.filter(Cache.creepsInRoom("claimer", room), (c) => c.memory.claim === toRoom).length;

                    num += count;
                    max += 1;

                    if (count === 0) {
                        Claimer.spawn(room, toRoom);
                    }
                });
            }

            // Output claimer count in the report.
            if (max > 0) {
                console.log("    Claimers: " + num + "/" + max);
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

            // Get the total energy in the room, limited to 650.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(room), 650);

            // If we're not at 650 and energy is not at capacity, bail.
            if (energy < 650 && energy !== Utilities.getEnergyCapacityInRoom(room)) {
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
            name = spawnToUse.createCreep(body, undefined, {role: "claimer", home: room.name, claim: toRoom});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new claimer " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("claimer", room)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If the creeps are not in the room, rally them.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.claim), (creep) => {
                var task = TaskRally.getClaimerTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Claim the controller.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskClaim.getTask(creep);
                if (task.canAssign(creep)) {
                    creep.say("Claiming");
                    assigned.push(creep.name);
                };
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If we have claimed, set the room as a base, stop trying to claim the room, and suicide any remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                var oldRoomType; 
                if (creep.room.name === creep.memory.claim && creep.room.controller.my) {
                    oldRoomType = Memory.rooms[creep.room.name].type;
                    Commands.setRoomType(creep.room.name, {type: "base"});
                    Commands.claimRoom(creep.memory.home, room.name, false);
                    creep.suicide();
                    switch (oldRoomType) {
                        case "mine":
                            _.forEach(Cache.creepsInRoom(room.name), (creep) => {
                                switch (creep.memory.role) {
                                    case "remoteBuilder":
                                    case "remoteWorker":
                                        creep.memory.role = "worker";
                                        creep.memory.home = room.name;
                                        creep.memory.homeSource = Utilities.objectsClosestToObj(Cache.energySourcesInRoom(room), creep)[0].id;
                                        break;
                                    case "remoteReserver":
                                        creep.suicide();
                                        break;
                                    case "remoteStorer":
                                        creep.memory.role = "storer";
                                        creep.memory.home = creep.memory.supportRoom;
                                    case "dismantler":
                                        creep.memory.home = room.name;
                                        creep.memory.supportRoom = room.name;
                                        break;
                                }
                            });
                    }
                }
            });
        }
    };

require("screeps-profiler").registerObject(Claimer, "RoleClaimer");
module.exports = Claimer;
