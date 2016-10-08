var Cache = require("cache"),

    utilities = {
        creepsWithTask: (creeps, task) => {
            return _.filter(creeps, (c) => c.memory.currentTask && _.isMatch(c.memory.currentTask, task));
        },

        creepsWithNoTask: (creeps) => {
            return _.filter(creeps, (c) => !c.memory.currentTask);
        },

        objectsClosestToObj: (objects, obj) => {
            if (objects.length === 0) {
                return [];
            }

            if (!obj) {
                return objects;
            }
            
            var objList = _.map(objects, (o) => {
                return {
                    object: o,
                    distance: obj.pos.getRangeTo(o)
                };
            });
            
            objList.sort((a, b) => {
                return a.distance - b.distance;
            });
            
            return _.map(objList, (o) => o.object);
        },

        getEmptyPosAroundPos: (pos) => {
            var count = 0,
                x, y, checkPos;

            for (x = pos.x - 1; x < pos.x + 2; x++) {
                for (y = pos.y - 1; y < pos.y + 2; y++) {
                    // Don't need to check the origin.
                    if (x === pos.x && y === pos.y) {
                        continue;
                    }

                    checkPos = new RoomPosition(x, y, pos.roomName);
                    if (checkPos) {
                        count += _.filter(checkPos.look(), (o) => o.type === "terrain" && o.terrain !== "wall").length;
                    }
                }
            }

            return count;
        },


        // Get available energy in room.
        getAvailableEnergyInRoom: (room) => {
            var structures = [].concat.apply([], [Cache.spawnsInRoom(room), Cache.extensionsInRoom(room)]);
            return _.reduce(structures, function(sum, s) {return sum + s.energy;}, 0);
        },

        // Get energy capacity in room.
        getEnergyCapacityInRoom: (room) => {
            var structures = [].concat.apply([], [Cache.spawnsInRoom(room), Cache.extensionsInRoom(room)]);
            return _.reduce(structures, function(sum, s) {return sum + s.energyCapacity;}, 0);
        },

        // Set a number of creeps to deliver energy from a specific location.
        deliverEnergy: (fromId, fromX, fromY, fromRoomName, toRoom, maxCreeps) => {
            if (!Memory.maxCreeps.delivery) {
                Memory.maxCreeps.delivery = {}
            }

            if (!Memory.maxCreeps.delivery[toRoom]) {
                Memory.maxCreeps.delivery[toRoom] = {}
            }

            if (maxCreeps === 0) {
                delete Memory.maxCreeps.delivery[toRoom][fromId];
            } else {
                Memory.maxCreeps.delivery[toRoom][fromId] = {
                    fromPos: {
                        x: fromX,
                        y: fromY,
                        roomName: fromRoomName
                    },
                    maxCreeps: maxCreeps
                };
            }
        }
    };

require("screeps-profiler").registerObject(utilities, "Utilities");
module.exports = utilities;
