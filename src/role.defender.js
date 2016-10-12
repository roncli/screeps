var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),

    Defender = {
        checkSpawn: (room) => {
            "use strict";

            var count;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If we have less than max defenders, spawn a defender.
            count = Cache.creepsInRoom("defender", room).length;
            if (count < Memory.maxCreeps.defender) {
                Defender.spawn(room);
            }

            // Output defender count in the report.
            console.log("    Defenders: " + count.toString() + "/" + Memory.maxCreeps.defender.toString());        
        },
        
        spawn: (room) => {
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
            energy = _.reduce(structures, function(sum, s) {return sum + s.energy;}, 0);

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            if (energy % 650 >= 350 && energy % 650 < 450) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(RANGED_ATTACK);
            }

            if (energy % 650 >= 200) {
                body.push(RANGED_ATTACK);
            }

            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(HEAL);
            }

            if (energy % 650 >= 450) {
                body.push(HEAL);
            }

            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(MOVE);
                body.push(MOVE);
                body.push(MOVE);
                body.push(MOVE);
            }

            if (energy % 650 >= 50) {
                body.push(MOVE);
            }

            if ((energy % 650 >= 100 && energy % 650 < 200) || (energy % 650 >= 250 && energy % 650 < 450) || (energy % 650 >= 500)) {
                body.push(MOVE);
            }

            if ((energy % 650 >= 150 && energy % 650 < 200) || (energy % 650 >= 300 && energy % 650 < 450) || (energy % 650 >= 550)) {
                body.push(MOVE);
            }

            if ((energy % 650 >= 400 && energy % 650 < 450) || (energy % 650 >= 600)) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "defender"});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new defender " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room) => {
            "use strict";

            var tasks;

            // Find hostiles to attack.
            tasks = TaskRangedAttack.getTasks(room);
            if (tasks.length > 0) {
                console.log("    Hostiles: " + tasks.length);
                _.forEach(_.take(tasks, 5), (task) => {
                    console.log("      " + task.enemy.pos.x + "," + task.enemy.pos.y + " " + task.enemy.hits + "/" + task.enemy.hitsMax + " " + (100 * task.enemy.hits / task.enemy.hitsMax).toFixed(3) + "%");
                });
            }
            _.forEach(tasks, (task) => {
                _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("defender", room)), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Die!", true);
                    }
                });
            });

            // Find allies to heal.
            tasks = TaskHeal.getTasks(room);
            if (tasks.length > 0) {
                console.log("    Creeps to heal: " + tasks.length);
                _.forEach(_.take(tasks, 5), (task) => {
                    console.log("      " + task.ally.pos.x + "," + task.ally.pos.y + " " + task.ally.hits + "/" + task.ally.hitsMax + " " + (100 * task.ally.hits / task.ally.hitsMax).toFixed(3) + "%");
                });
            }
            _.forEach(tasks, (task) => {
                var hitsMissing = task.ally.hitsMax - task.ally.hits - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("defender", room), {type: "heal", id: task.id}), function(sum, c) {return sum + c.getActiveBodyparts(HEAL) * 12;}, 0);
                if (hitsMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("defender", room)), task.ally), (creep) => {
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
            tasks = TaskRally.getAttackerTasks(room);
            _.forEach(tasks, (task) => {
                _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("defender", room)), (creep) => {
                    task.canAssign(creep);
                });
            });
        }
    };

require("screeps-profiler").registerObject(Defender, "RoleDefender");
module.exports = Defender;
