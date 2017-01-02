var Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskReserve = require("task.reserve"),

    Reserver = {
        checkSpawn: (room) => {
            "use strict";

            var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
                supportRoomName = supportRoom.name,
                spawns = Cache.spawnsInRoom(supportRoom),
                controller = room.controller,
                reservers = Cache.creepsInRoom("remoteReserver", room),
                count = 0,
                max = 0,
                id, reservation;
            
            // If there are no spawns in the support room, or the room is unobservable, or there is no controller in the room, ignore the room.
            if (spawns.length === 0 || room.unobservable || !controller) {
                return;
            }
            
            id = controller.id;
            reservation = controller.reservation;

            // Init road length cache.
            if (!Memory.lengthToController) {
                Memory.lengthToController = {};
            }

            // Calculate path length from controller to support room's storage.
            if (!Memory.lengthToController[id]) {
                Memory.lengthToController[id] = {};
            }
            if (!Memory.lengthToController[id][supportRoomName]) {
                Memory.lengthToController[id][supportRoomName] = PathFinder.search(controller.pos, {pos: spawns[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
            }

            count = _.filter(reservers, (c) => c.spawning || c.ticksToLive > Memory.lengthToController[id][supportRoomName]).length;

            if (!reservation || reservation.ticksToEnd < 4000) {
                max += 1;
            }

            if (count < max) {
                Reserver.spawn(room, supportRoom);
            }

            // Output remote reserver count in the report.
            if (reservers.length > 0 || max > 0) {
                Cache.log.rooms[room.name].creeps.push({
                    role: "remoteReserver",
                    count: reservers.length,
                    max: max
                });
            }        
        },
        
        spawn: (room, supportRoom) => {
            "use strict";

            var body = [],
                roomName = room.name,
                supportRoomName = supportRoom.name,
                energy, units, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 6500.
            energy = Math.min(supportRoom.energyCapacityAvailable, 6500);
            units = Math.floor(energy / 650);

            // Create the body based on the energy.
            for (count = 0; count < units; count++) {
                body.push(CLAIM);
            }

            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region), (s) => s.room.name === supportRoomName ? 0 : 1)[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "remoteReserver-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "remoteReserver", home: roomName, supportRoom: supportRoomName});
            if (spawnToUse.room.name === supportRoomName) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
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
