var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskRally = require("task.rally"),

    Reserver = {
        checkSpawn: (room) => {
            "use strict";

            var num = 0, max = 0,
                count, sources, capacity;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // Loop through the room reservers to see if we need to spawn a creep.
            if (Memory.maxCreeps.reserver) {
                _.forEach(Memory.maxCreeps.reserver[room.name], (value, toRoom) => {
                    var count = _.filter(Game.creeps, (c) => c.memory.role === "reserver" && c.memory.reserve === toRoom).length;

                    num += count;
                    max += value.maxCreeps;

                    if (count === 0) {
                        Reserver.spawn(room, toId);
                    }
                });
            }

            // Output reserver count in the report.
            console.log("    Reservers: " + num + "/" + max);        
        },
        
        spawn: (room, id) => {
            "use strict";

            var body = [],
                structures, energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the spawns and extensions in the room.
            structures = [].concat.apply([], [Cache.spawnsInRoom(room), Cache.extensionsInRoom(room)]);

            // Fail if any of the structures aren't full.
            if (_.filter(structures, (s) => s.energy !== s.energyCapacity).length !== 0) {
                return false;
            }

            // Get the total energy in the room.
            energy = Utilities.getAvailableEnergyInRoom(room);

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(CLAIM);
            }

            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "reserver", reserve: room.name, home: id});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new reserver " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room) => {
            "use strict";

            // Attempt to reserve controller.
            // TODO
        }
    };

require("screeps-profiler").registerObject(Reserver, "RoleReserver");
module.exports = Reserver;
