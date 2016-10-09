var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRally = require("task.rally"),

    Ranged = {
        checkSpawn: (room) => {
            "use strict";

            var count;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If we have less than max ranged attackers, spawn a ranged attacker.
            count = Cache.creepsInRoom("rangedAttack", room).length;
            if (count < Memory.maxCreeps.rangedAttack) {
                Ranged.spawn(room);
            }

            // Output ranged attacker count in the report.
            console.log("    Ranged Attackers: " + count.toString() + "/" + Memory.maxCreeps.rangedAttack.toString());        
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
            for (count = 0; count < Math.floor(energy / 350); count++) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            if (energy % 350 >= 150 && energy % 350 < 250) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            for (count = 0; count < Math.floor(energy / 350); count++) {
                body.push(RANGED_ATTACK);
            }

            if (energy % 350 >= 250) {
                body.push(RANGED_ATTACK);
            }

            for (count = 0; count < Math.floor(energy / 350); count++) {
                body.push(MOVE);
                body.push(MOVE);
                body.push(MOVE);
            }

            if (energy % 350 >= 50) {
                body.push(MOVE);
            }

            if (energy % 350 >= 100) {
                body.push(MOVE);
            }

            if ((energy % 350 >= 200 && energy % 350 < 250) || (energy % 350 >= 300)) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "rangedAttack"});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new ranged attacker " + name);
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

                // Attack with tower if possible.
                // TODO: Break this out into a role & task.
                _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                    tower.attack(tasks[0].enemy);
                });
            }
            _.forEach(tasks, (task) => {
                _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("rangedAttack", room)), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Die!", true);
                    }
                });
            });

            // Rally the troops!
            tasks = TaskRally.getAttackerTasks(room);
            _.forEach(tasks, (task) => {
                _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("rangedAttack", room)), (creep) => {
                    task.canAssign(creep);
                });
            });
        }
    };

require("screeps-profiler").registerObject(Ranged, "RoleRangedAttack");
module.exports = Ranged;
