var Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskReserve = require("task.reserve"),

    Reserver = {
        checkSpawn: (room) => {
            "use strict";

            var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
                count = 0,
                max = 0;
            
            // If there are no spawns in the support room, or the room is unobservable, or there is no controller in the room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || !room.controller) {
                return;
            }

            // Init road length cache.
            if (!Memory.lengthToController) {
                Memory.lengthToController = {};
            }

            // Calculate path length from controller to support room's storage.
            if (!Memory.lengthToController[room.controller.id]) {
                Memory.lengthToController[room.controller.id] = {};
            }
            if (!Memory.lengthToController[room.controller.id][supportRoom.name]) {
                Memory.lengthToController[room.controller.id][supportRoom.name] = PathFinder.search(room.controller.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
            }

            count = _.filter(Cache.creepsInRoom("remoteReserver", room), (c) => c.spawning || c.ticksToLive > Memory.lengthToController[room.controller.id][supportRoom.name]).length;

            if (!room.controller.reservation || room.controller.reservation.ticksToEnd < 4000) {
                max += 1;
            }

            if (count < max) {
                Reserver.spawn(room, supportRoom);
            }

            // Output remote reserver count in the report.
            if (count > 0 || max > 0) {
                Cache.log.rooms[room.name].creeps.push({
                    role: "remoteReserver",
                    count: Cache.creepsInRoom("remoteReserver", room).length,
                    max: max
                });
            }        
        },
        
        spawn: (room, supportRoom) => {
            "use strict";

            var body = [],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 16250.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(supportRoom), 16250);

            // If we're not at 16250 and energy is not at capacity, bail.
            if (energy < 16250 && energy !== Utilities.getEnergyCapacityInRoom(supportRoom)) {
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
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]), (s) => s.room.name === supportRoom.name ? 0 : 1)[0];
            name = spawnToUse.createCreep(body, undefined, {role: "remoteReserver", home: room.name, supportRoom: supportRoom.name});
            if (spawnToUse.room.name === supportRoom.name) {
                Cache.spawning[spawnToUse.id] = true;
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("remoteReserver", room)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If we have claimed the controller, stop trying to reserve the room and suicide any remaining creeps.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (creep.room.name === creep.memory.home && creep.room.controller.my) {
                        assigned.push(creep.name);
                        Commands.setRoomType(creep.room, {type: "base"});
                        creep.suicide();
                        // TODO: Assign other creeps in room to another task if possible.
                    }
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Reserve the controller if we are in the room.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.home), (creep) => {
                var task = TaskReserve.getRemoteTask(creep);
                if (task.canAssign(creep)) {
                    creep.say("Reserving");
                    assigned.push(creep.name);
                };
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Rally the troops!
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskRally(creep.memory.home);
                task.canAssign(creep);
            });
        }
    };

require("screeps-profiler").registerObject(Reserver, "RoleRemoteReserver");
module.exports = Reserver;
