var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskMeleeAttack = require("task.meleeAttack"),

    Melee = {
        checkSpawn: (room) => {
            "use strict";

            var melee = Cache.creepsInRoom("meleeAttack", room),
                meleeAttack = Memory.maxCreeps.meleeAttack,
                roomName = room.name,
                num = 0,
                max = 0;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // Loop through the room melee attackers to see if we need to spawn a creep.
            if (meleeAttack) {
                _.forEach(meleeAttack[roomName], (value, toRoomName) => {
                    var count = _.filter(melee, (c) => c.memory.defending === toRoomName).length,
                        toRoom = Game.rooms[toRoomName],
                        maxCreeps = value.maxCreeps;
                        
                    num += count;

                    if ((toRoom && toRoom.memory.harvested >= 30000) || Cache.hostilesInRoom(toRoom).length > 0) {
                        max += maxCreeps;
                    }

                    if (count < maxCreeps) {
                        Melee.spawn(room, toRoomName);
                    }
                });
            }

            // Output melee attacker count in the report.
            if (melee.length > 0 || max > 0) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "meleeAttack",
                    count: melee.length,
                    max: max
                });
            }        
        },
        
        spawn: (room, toRoomName) => {
            "use strict";

            var body = [],
                roomName = room.name,
                energy, units, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 3250.
            energy = Math.min(room.energyCapacityAvailable, 3250);
            units = Math.floor(energy / 130);

            // Create the body based on the energy.
            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            for (count = 0; count < units; count++) {
                body.push(ATTACK);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === room.memory.region), (s) => s.room.name === roomName ? 0 : 1)[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "meleeAttack-" + toRoomName + "-" + Game.time.toFixed(0).substring(4), {role: "meleeAttack", home: roomName, defending: toRoomName});
            if (spawnToUse.room.name === roomName) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("meleeAttack", room)), (c) => !c.spawning && c.ticksToLive > 150),
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
                var task = TaskMeleeAttack.getDefenderTask(creep);
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

            // Rally the troops!
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.defending), (creep) => {
                var task = TaskRally.getDefenderTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });
        }
    };

require("screeps-profiler").registerObject(Melee, "RoleMeleeAttack");
module.exports = Melee;
