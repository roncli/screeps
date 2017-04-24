var Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskAttack = require("task.attack"),

    Converter = {
        checkSpawn: (room) => {
            "use strict";

            var converter = Memory.maxCreeps.converter,
                roomName = room.name,
                converters = Cache.creeps[roomName] && Cache.creeps[roomName].converter || [],
                num = 0,
                max = 0;
            
            // Loop through the room converters to see if we need to spawn a creep.
            if (converter) {
                _.forEach(converter[roomName], (value, toRoom) => {
                    var count = _.filter(converters, (c) => c.memory.attack === toRoom).length;

                    num += count;
                    max += 1;

                    if (count === 0) {
                        Converter.spawn(room, toRoom);
                    }
                });
            }

            // Output converter count in the report.
            if (Memory.log && (converters.length > 0 || max > 0)) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "converter",
                    count: converters.length,
                    max: max
                });
            }        
        },
        
        spawn: (room, toRoom) => {
            "use strict";

            var body = [],
                roomName = room.name,
                spawns = Cache.spawnsInRoom(room),
                supportRoomName = supportRoom.name,
                energy, units, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 24400.
            energy = Math.min(supportRoom.energyCapacityAvailable, 24400);
            units = Math.floor(energy / 3050);

            // Create the body based on the energy.
            for (count = 0; count < units; count++) {
                body.push(CLAIM);
                body.push(CLAIM);
                body.push(CLAIM);
                body.push(CLAIM);
                body.push(CLAIM);
            }

            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, `converter-${toRoom}-${Game.time.toFixed(0).substring(4)}`, {role: "converter", home: room.name, attack: toRoom});
            Cache.spawning[spawnToUse.id] = typeof name !== "number";

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var roomName = room.name,
                creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].converter || []),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If the creeps are not in the room, rally them.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.attack), (creep) => {
                var task = TaskRally.getClaimerTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attack the controller.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskAttack.getTask(creep);
                if (task.canAssign(creep)) {
                    creep.say("Attacking");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Suicide any remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                creep.suicide();
            });
        }
    };

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Converter, "RoleConverter");
}
module.exports = Converter;
