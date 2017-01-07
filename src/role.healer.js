var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),

    Healer = {
        checkSpawn: (room) => {
            "use strict";

            var healers = Cache.creepsInRoom("healer", room),
                healer = Memory.maxCreeps.healer,
                roomName = room.name,
                supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
                supportRoomName = supportRoom.name,
                max = 0;
            
            // Loop through the room healers to see if we need to spawn a creep.
            if (healer && healer[supportRoomName] && healer[supportRoomName][roomName]) {
                if ((room && room.memory.harvested >= 30000) || Cache.hostilesInRoom(room).length > 0) {
                    max = healer[supportRoomName][roomName].maxCreeps;
                    
                    if (healers.length < max) {
                        Healer.spawn(room, supportRoom);
                    }
                }
            }

            // Output healer count in the report.
            if (Memory.log && (healers.length > 0 || max > 0)) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "healer",
                    count: healers.length,
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

            // Get the total energy in the room, limited to 7500.
            energy = Math.min(supportRoom.energyCapacityAvailable, 7500);
            units = Math.floor(energy / 300);

            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            for (count = 0; count < units; count++) {
                body.push(HEAL);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "healer-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "healer", home: roomName, supportRoom: supportRoomName});
            if (spawnToUse.room.name === supportRoomName) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("healer", room)), (c) => !c.spawning),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If the creeps are not in the room, rally them.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.room), (creep) => {
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
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.room), (creep) => {
                var task = TaskRally.getDefenderTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });
        }
    };

require("screeps-profiler").registerObject(Healer, "RoleHealer");
module.exports = Healer;
