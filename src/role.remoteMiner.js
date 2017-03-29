var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),
    TaskRally = require("task.rally"),

    Miner = {
        checkSpawn: (room) => {
            "use strict";

            var roomName = room.name,
                supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
                supportRoomName = supportRoom.name,
                miners = Cache.creeps[roomName] && Cache.creeps[roomName].remoteMiner || [],
                containers = Cache.containersInRoom(room),
                max = 0;

            // If there are no spawns in the support room, or the room is unobservable, or there are no containers in the room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || containers.length === 0) {
                return;
            }

            // Init road length cache.
            if (!Memory.lengthToContainer) {
                Memory.lengthToContainer = {};
            }

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(containers, (container) => {
                var containerId = container.id,
                    source;

                // Calculate path length from container to support room's storage.
                if (!Memory.lengthToContainer[containerId]) {
                    Memory.lengthToContainer[containerId] = {};
                }
                if (!Memory.lengthToContainer[containerId][supportRoomName]) {
                    Memory.lengthToContainer[containerId][supportRoomName] = PathFinder.search(container.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
                }

                if (!Memory.containerSource[containerId]) {
                    Memory.containerSource[containerId] = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0].id;
                }

                source = Game.getObjectById(Memory.containerSource[containerId]);

                // If this container is for a mineral, check to make sure it has resources.
                if (source instanceof Mineral) {
                    if (source.mineralAmount === 0) {
                        return;
                    }
                }

                max += 1;

                // If we don't have a remote miner for this container, spawn one.
                if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150 + Memory.lengthToContainer[containerId][supportRoomName] * 3) && c.memory.container === containerId).length === 0) {
                    Miner.spawn(room, supportRoom, containerId);
                }
            });

            // Output miner count in the report.
            if (Memory.log && (miners.length > 0 || max > 0)) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "remoteMiner",
                    count: miners.length,
                    max: max
                });
            }        
        },
        
        spawn: (room, supportRoom, id) => {
            "use strict";

            var body = (room.memory && room.memory.roomType && room.memory.roomType.type === "source") || /^[EW][1-9][0-9]*5[NS][1-9][0-9]*5$/.test(room.name) ? [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK] : [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
                roomName = room.name,
                supportRoomName = supportRoom.name,
                energy, units, remainder, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Do something different for minerals.
            if (Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), Game.getObjectById(id))[0] instanceof Mineral) {
                body = [];

                // Get the energy available, limiting to 4500.
                energy = Math.min(supportRoom.energyCapacityAvailable, 4500);
                units = Math.floor(energy / 450);
                remainder = energy % 450;

                // Create the body based on the energy.
                for (count = 0; count < units; count++) {
                    body.push(MOVE);
                }

                if (remainder >= 50) {
                    body.push(MOVE);
                }

                for (count = 0; count < units; count++) {
                    body.push(WORK);
                    body.push(WORK);
                    body.push(WORK);
                    body.push(WORK);
                }

                if (remainder >= 150) {
                    body.push(WORK);
                }

                if (remainder >= 250) {
                    body.push(WORK);
                }

                if (remainder >= 350) {
                    body.push(WORK);
                }
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "remoteMiner-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "remoteMiner", home: roomName, supportRoom: supportRoomName, container: id});
            if (spawnToUse.room.name === supportRoomName) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var roomName = room.name,
                creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteMiner || []),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to assign mine tasks.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskMine();
                    if (task.canAssign(creep)) {
                        creep.say("Mining");
                        assigned.push(creep.name);
                    }
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Rally remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskRally(creep.memory.home);
                task.canAssign(creep);
            });
        }
    };

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Miner, "RoleRemoteMiner");
}
module.exports = Miner;
