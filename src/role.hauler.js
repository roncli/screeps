var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskRally = require("task.rally"),

    Hauler = {
        checkSpawn: (room) => {
            "use strict";

            var supportRoom = Game.rooms[Cache.haulers[room.name]], max = 5;

            // If there are no spawns in the room, or the room is unobservable, or there is no storage in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0 || room.unobservable || !room.storage || !supportRoom.storage) {
                return;
            }

            // If we don't have enough remote haulers for this support room, spawn one.
            if (_.filter(Cache.creepsInRoom("hauler", room), (c) => (c.spawning || c.ticksToLive >= 150) && c.memory.supportRoom === supportRoom.name).length < max) {
                Hauler.spawn(room, supportRoom);
            }

            console.log("    Haulers: " + Cache.creepsInRoom("hauler", room).length + "/" + max);
        },
        
        spawn: (room, supportRoom) => {
            "use strict";

            var body = [],
                energy, spawnToUse, name, count;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 2400.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(room), 2400);

            // If we're not at 2400 and energy is not at capacity, bail.
            if (energy < 2400 && energy !== Utilities.getEnergyCapacityInRoom(supportRoom)) {
                return;
            }

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 150); count++) {
                body.push(CARRY);
                body.push(CARRY);
            }

            for (count = 0; count < Math.floor(energy / 150); count++) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "hauler", home: room.name, supportRoom: supportRoom.name});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new hauler " + name);
                _.forEach(Cache.creepsInRoom("worker", room), (creep) => {
                    creep.memory.completeTask = true;
                    return false;
                });
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("hauler", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled links.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.supportRoom && c.carry[RESOURCE_ENERGY] && c.carry[RESOURCE_ENERGY] > 0), (creep) => {
                var supportRoom = Game.rooms[creep.memory.supportRoom],
                    links = _.filter(Cache.linksInRoom(supportRoom)),
                    linkToUse;

                if (links.length < 2) {
                    return;
                }

                linkToUse = Utilities.objectsClosestToObjByPath(links, room.storage)[0];
                
                if (linkToUse.energy < linkToUse.energyCapacity && new TaskFillEnergy(linkToUse.id).canAssign(creep)) {
                    creep.say("Link");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled storage.
            _.forEach(creepsWithNoTask, (creep) => {
                var supportRoom = Game.rooms[creep.memory.supportRoom];

                if (new TaskFillEnergy(supportRoom.storage.id).canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to get energy from storage.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskCollectEnergy(room.storage.id);

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

require("screeps-profiler").registerObject(Hauler, "RoleHauler");
module.exports = Hauler;
