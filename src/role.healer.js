var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),

    Healer = {
        checkSpawn: (room) => {
            "use strict";

            var count;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If we have less than max healers, spawn a healer.
            count = Cache.creepsInRoom("healer", room).length;
            if (count < Memory.maxCreeps.healer) {
                Healer.spawn(room);
            }

            // Output healer count in the report.
            console.log("    Healers: " + count.toString() + "/" + Memory.maxCreeps.healer.toString());        
        },
        
        spawn: (room) => {
            "use strict";

            var body = [],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 2400.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(room), 2400);

            // If we're not at 2400 and energy is not at capacity, bail.
            if (energy < 2400 && energy !== Utilities.getEnergyCapacityInRoom(room)) {
                return;
            }

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 450); count++) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            if (energy % 450 >= 200 && energy % 450 < 300) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            for (count = 0; count < Math.floor(energy / 450); count++) {
                body.push(HEAL);
            }

            if (energy % 450 >= 300) {
                body.push(HEAL);
            }

            for (count = 0; count < Math.floor(energy / 450); count++) {
                body.push(MOVE);
                body.push(MOVE);
                body.push(MOVE);
            }

            if (energy % 450 >= 50) {
                body.push(MOVE);
            }

            if ((energy % 450 >= 100 && energy % 450 < 300) || (energy % 450 >= 350)) {
                body.push(MOVE);
            }

            if ((energy % 450 >= 150 && energy % 450 < 300) || (energy % 450 >= 400)) {
                body.push(MOVE);
            }

            if (energy % 450 >= 250 && energy % 450 < 300) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "healer"});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new healer " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room) => {
            "use strict";

            var tasks;

            // Find allies to heal.
            tasks = TaskHeal.getTasks(room);
            if (tasks.length > 0) {
                console.log("    Creeps to heal: " + tasks.length);
                _.forEach(_.take(tasks, 5), (task) => {
                    console.log("      " + task.ally.pos.x + "," + task.ally.pos.y + " " + task.ally.hits + "/" + task.ally.hitsMax + " " + (100 * task.ally.hits / task.ally.hitsMax).toFixed(3) + "%");
                });
            }
            _.forEach(tasks, (task) => {
                var hitsMissing = task.ally.hitsMax - task.ally.hits - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("healer", room), {type: "heal", id: task.id}), function(sum, c) {return sum + c.getActiveBodyparts(HEAL) * 12;}, 0);
                if (hitsMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("healer", room)), task.ally), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Heal");
                            hitsMissing -= creep.getActiveBodyparts(HEAL) * 12;
                            if (hitsMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Rally the troops!
            tasks = TaskRally.getHealerTasks(room);
            _.forEach(tasks, (task) => {
                _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("healer", room)), (creep) => {
                    task.canAssign(creep);
                });
            });
        }
    };

require("screeps-profiler").registerObject(Healer, "RoleHealer");
module.exports = Healer;
