var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),

    Defender = {
        checkSpawn: (room) => {
            "use strict";

            var roomName = room.name,
                defenders = Cache.creeps[roomName] && Cache.creeps[roomName].defender || [],
                defender = Memory.maxCreeps.defender,
                supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
                supportRoomName = supportRoom.name,
                max = 0;
            
            // Loop through the room defenders to see if we need to spawn a creep.
            if (defender && defender[supportRoomName] && defender[supportRoomName][roomName]) {
                if ((room && room.memory.harvested >= 100000) || Cache.hostilesInRoom(room).length > 0 || (room && room.memory && room.memory.roomType && room.memory.roomType.type === "source")) {
                    max = defender[supportRoomName][roomName].maxCreeps;

                    if (defenders.length < max) {
                        Defender.spawn(room, supportRoom);
                    }
                }
            }

            // Output defender count in the report.
            if (Memory.log && (defenders.length > 0 || max > 0)) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "defender",
                    count: defenders.length,
                    max: max
                });
            }        
        },
        
        spawn: (room, supportRoom) => {
            "use strict";

            var body = [],
                roomName = room.name,
                supportRoomName = supportRoom.name,
                energy, units, remainder, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 6200.
            energy = Math.min(supportRoom.energyCapacityAvailable, 6200);
            units = Math.floor(energy / 500);
            remainder = energy % 500;

            // Create the body based on the energy.
            for (count = 0; count < units; count++) {
                body.push(MOVE);
                body.push(MOVE);
            }

            if (remainder >= 50) {
                body.push(MOVE);
            }

            if (remainder >= 250) {
                body.push(MOVE);
            }

            for (count = 0; count < units; count++) {
                body.push(HEAL);
            }

            for (count = 0; count < units; count++) {
                body.push(RANGED_ATTACK);
            }

            if (remainder >= 200) {
                body.push(RANGED_ATTACK);
            } 

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "defender-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "defender", home: roomName, supportRoom: supportRoomName});
            if (spawnToUse.room.name === supportRoomName) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var roomName = room.name,
                creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].defender || []), (c) => !c.spawning),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If the creeps are not in the room, rally them.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.home), (creep) => {
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
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.home), (creep) => {
                var task = TaskRally.getDefenderTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });
        }
    };

require("screeps-profiler").registerObject(Defender, "RoleDefender");
module.exports = Defender;
