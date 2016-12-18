var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),

    Defender = {
        checkSpawn: (room) => {
            "use strict";

            var num = 0, max = 0;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // Loop through the room defenders to see if we need to spawn a creep.
            if (Memory.maxCreeps.defender) {
                _.forEach(Memory.maxCreeps.defender[room.name], (value, toRoom) => {
                    var count = _.filter(Cache.creepsInRoom("defender", room), (c) => c.memory.defending === toRoom).length;
                    num += count;

                    if (Game.rooms[toRoom].memory.harvested >= 30000 || Cache.hostilesInRoom(Game.rooms[toRoom]).length > 0) {
                        max += value.maxCreeps;
                    }

                    if (count < value.maxCreeps) {
                        Defender.spawn(room, toRoom);
                    }
                });
            }

            // Output defender count in the report.
            if (max > 0) {
                Cache.log.rooms[room.name].creeps.push({
                    role: "defender",
                    count: num,
                    max: max
                });
            }        
        },
        
        spawn: (room, toRoom) => {
            "use strict";

            var body = [],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 6200.
            energy = Math.min(room.energyCapacityAvailable, 6200);

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 500); count++) {
                body.push(MOVE);
                body.push(MOVE);
            }

            if (energy % 500 >= 50) {
                body.push(MOVE);
            }

            if (energy % 500 >= 250) {
                body.push(MOVE);
            }

            for (count = 0; count < Math.floor(energy / 500); count++) {
                body.push(HEAL);
            }

            for (count = 0; count < Math.floor(energy / 500); count++) {
                body.push(RANGED_ATTACK);
            }

            if (energy % 500 >= 200) {
                body.push(RANGED_ATTACK);
            } 

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === room.memory.region), (s) => s.room.name === room.name ? 0 : 1)[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "defender-" + toRoom + "-" + Game.time.toFixed(0).substring(4), {role: "defender", home: room.name, defending: toRoom});
            if (spawnToUse.room.name === room.name) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("defender", room)), (c) => !c.spawning && c.ticksToLive > 150),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If the creeps are not in the room, rally them.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.defending), (creep) => {
                var task = TaskRally.getDefenderTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
            
            // Find hostiles to attack.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskRangedAttack.getDefenderTask(creep);
                if (task && task.canAssign(creep)) {
                    creep.say("Die!", true);
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Find allies to heal.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskHeal.getDefenderTask(creep);
                if (task && task.canAssign(creep)) {
                    creep.say("Heal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Rally the troops!
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.defending), (creep) => {
                var task = TaskRally.getDefenderTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });
        }
    };

require("screeps-profiler").registerObject(Defender, "RoleDefender");
module.exports = Defender;
