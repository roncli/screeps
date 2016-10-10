var Cache = require("cache"),

    Utilities = {
        creepsWithTask: (creeps, task) => {
            "use strict";

            return _.filter(creeps, (c) => c.memory.currentTask && _.isMatch(c.memory.currentTask, task));
        },

        creepsWithNoTask: (creeps) => {
            "use strict";

            return _.filter(creeps, (c) => !c.memory.currentTask);
        },

        objectsClosestToObj: (objects, obj) => {
            "use strict";

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
            "use strict";

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
            "use strict";

            var structures = [].concat.apply([], [Cache.spawnsInRoom(room), Cache.extensionsInRoom(room)]);
            return _.reduce(structures, function(sum, s) {return sum + s.energy;}, 0);
        },

        // Get energy capacity in room.
        getEnergyCapacityInRoom: (room) => {
            "use strict";

            var structures = [].concat.apply([], [Cache.spawnsInRoom(room), Cache.extensionsInRoom(room)]);
            return _.reduce(structures, function(sum, s) {return sum + s.energyCapacity;}, 0);
        },

        // Set a number of creeps to deliver energy from a specific location.
        deliverEnergy: (fromId, fromX, fromY, fromRoomName, toRoom, maxCreeps) => {
            "use strict";

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
        },

        checkSiteIsClear: (pos) => {
            "use strict";

            var siteClear = true,
                room = new Room(pos.roomName),
                structures;
            
            // Cannot be a wall, or be next to a wall horizontally or vertically.
            if (
                (new RoomPosition(pos.x, pos.y, pos.roomName)).lookFor(LOOK_TERRAIN) === "wall" ||
                (new RoomPosition(pos.x - 1, pos.y, pos.roomName)).lookFor(LOOK_TERRAIN) === "wall" ||
                (new RoomPosition(pos.x + 1, pos.y, pos.roomName)).lookFor(LOOK_TERRAIN) === "wall" ||
                (new RoomPosition(pos.x, pos.y - 1, pos.roomName)).lookFor(LOOK_TERRAIN) === "wall" ||
                (new RoomPosition(pos.x, pos.y + 1, pos.roomName)).lookFor(LOOK_TERRAIN) === "wall"
            ) {
                return false;
            }

            // Cannot be within 1 square of a source.
            _.forEach(Cache.energySourcesInRoom(room), (source) => {
                return siteClear = pos.getRangeTo(source) > 1;
            });
            if (!siteClear) {
                return false;
            }
            
            // Cannot be within 1 square of a mineral.
            _.forEach(Cache.mineralsInRoom(room), (source) => {
                return siteClear = pos.getRangeTo(source) > 1;
            });
            if (!siteClear) {
                return false;
            }
            
            // Cannot be within 4 squares of the room controller.
            siteClear = pos.getRangeTo(room.controller) > 4;
            if (!siteClear) {
                return false;
            }

            // If the site is clear, we're done.  Don't count ramparts.
            structures = _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType !== "rampart");
            if (structures.length === 0) {
                return true;
            }

            // We're not clear if there are structures other than roads or walls.
            if (_.filter(structures, (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1).length !== structures.length) {
                return false;
            }

            // Return the structure list for potential destruction.
            return structures;
        },

        buildStructures: (room, structureType, structuresToBuild, buildAroundObj) => {
            var distanceFromSpawn = 1,
                x, y, siteIsClear;

            while (structuresToBuild > 0 && distanceFromSpawn < 50) {
                for (x = buildAroundObj.pos.x - distanceFromSpawn; x <= buildAroundObj.pos.x + distanceFromSpawn; x += 2) {
                    for (y = buildAroundObj.pos.y - distanceFromSpawn; x <= buildAroundObj.pos.y + distanceFromSpawn; y += (Math.abs(buildAroundObj.pos.x - x) === distanceFromSpawn ? 2 : 2 * distanceFromSpawn)) {
                        // Don't check outside of the room.
                        if (x < 1 || x > 48 || y < 1 || y > 48) {
                            continue;
                        }

                        // If there is already a construction site here, skip.
                        if (_.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === x && s.pos.y === y).length > 0) {
                            continue;
                        }

                        // Check if the site is clear.
                        siteIsClear = Utilities.checkSiteIsClear(new RoomPosition(x, y, room.name));
                        if (siteIsClear === false) {
                            continue;
                        }

                        // Check if there's anything to destroy.
                        if (siteIsClear !== true) {
                            _.forEach(siteIsClear, (structure) => {
                                structure.destroy();
                            });
                        }

                        // Build the structure.
                        room.createConstructionSite(x, y, structureType);
                        structuresToBuild--;
                    }
                }

                distanceFromSpawn++;
            }
        }
    };

require("screeps-profiler").registerObject(Utilities, "Utilities");
module.exports = Utilities;
