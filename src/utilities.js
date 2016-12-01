var Cache = require("cache"),

    Utilities = {
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
                var range;
                
                if (Memory.ranges && Memory.ranges[obj.id] && Memory.ranges[obj.id][o.id]) {
                    range = Memory.ranges[obj.id][o.id];
                } else {
                    range = obj.pos.getRangeTo(o);
                    if (!(o instanceof Creep) && !(obj instanceof Creep)) {
                        if (!Memory.ranges) {
                            Memory.ranges = {};
                        }
                        if (!Memory.ranges[obj.id]) {
                            Memory.ranges[obj.id] = {};
                        }
                        Memory.ranges[obj.id][o.id] = range;
                    }
                }

                return {
                    object: o,
                    distance: range
                };
            });
            
            objList.sort((a, b) => {
                return a.distance - b.distance;
            });
            
            return _.map(objList, (o) => o.object);
        },

        objectsClosestToObjByPath: (objects, obj, range) => {
            "use strict";

            if (objects.length === 0) {
                return [];
            }

            if (!obj) {
                return objects;
            }

            if (!range) {
                range = 1;
            }
            
            var objList = _.map(objects, (o) => {
                var distance;
                
                if (Memory.distances && Memory.distances[obj.id] && Memory.distances[obj.id][o.id]) {
                    distance = Memory.distances[obj.id][o.id];
                } else {
                    distance = PathFinder.search(obj.pos, {pos: o.pos, range: range}, {swampCost: 1, maxOps: obj.pos.roomName === o.pos.roomName ? 2000 : 100000}).path.length;
                    if (!(o instanceof Creep) && !(obj instanceof Creep)) {
                        if (!Memory.distances) {
                            Memory.distances = {};
                        }
                        if (!Memory.distances[obj.id]) {
                            Memory.distances[obj.id] = {};
                        }
                        Memory.distances[obj.id][o.id] = distance;
                    }
                }

                return {
                    object: o,
                    distance: distance
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

        checkSiteIsClear: (pos) => {
            "use strict";

            var siteClear = true,
                room = Game.rooms[pos.roomName],
                structures;
            
            // Cannot be a wall or have walls on opposite sides.
            if (
                new RoomPosition(pos.x, pos.y, pos.roomName).lookFor(LOOK_TERRAIN)[0] === "wall" ||
                (
                    new RoomPosition(pos.x - 1, pos.y, pos.roomName).lookFor(LOOK_TERRAIN)[0] === "wall" &&
                    new RoomPosition(pos.x + 1, pos.y, pos.roomName).lookFor(LOOK_TERRAIN)[0] === "wall"
                ) ||
                (
                    new RoomPosition(pos.x, pos.y - 1, pos.roomName).lookFor(LOOK_TERRAIN)[0] === "wall" &&
                    new RoomPosition(pos.x, pos.y + 1, pos.roomName).lookFor(LOOK_TERRAIN)[0] === "wall"
                )
            ) {
                return false;
            }

            // Cannot be within 1 square of a source.
            _.forEach(room.find(FIND_SOURCES), (source) => {
                return siteClear = pos.getRangeTo(source) > 1;
            });
            if (!siteClear) {
                return false;
            }
            
            // Cannot be within 1 square of a mineral.
            _.forEach(room.find(FIND_MINERALS), (source) => {
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
                    for (y = buildAroundObj.pos.y - distanceFromSpawn; y <= buildAroundObj.pos.y + distanceFromSpawn; y += (Math.abs(buildAroundObj.pos.x - x) === distanceFromSpawn ? 2 : 2 * distanceFromSpawn)) {
                        // Don't check outside of the room.
                        if (x < 1 || x > 48 || y < 1 || y > 48) {
                            continue;
                        }

                        // If there is already a construction site here, skip.
                        if (_.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => s.pos.x === x && s.pos.y === y).length > 0) {
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
                        if (structuresToBuild === 0) {
                            break;
                        }
                    }
                    if (structuresToBuild === 0) {
                        break;
                    }
                }

                distanceFromSpawn++;
            }
        },
        
        getBodypartCost: (body) => {
            return _.sum(_.map(body, (b) => BODYPART_COST[b]));
        },

        getSourceLabs: (room) => {
            var sourceLabs = [];

            _.forEach(Cache.labsInRoom(room), (lab) => {
                if (Utilities.objectsClosestToObj(Cache.labsInRoom(room), lab)[Cache.labsInRoom(room).length - 1].pos.getRangeTo(lab) <= 2) {
                    sourceLabs.push(lab.id);
                    if (sourceLabs.length >= 2) {
                        return false;
                    }
                }
            });

            return sourceLabs;
        },

        getLabToBoostWith: (room) => {
            var sourceLabs = (room.memory.labQueue && room.memory.labQueue.sourceLabs) ? room.memory.labQueue.sourceLabs : [],
                labToUse = null;

            if (sourceLabs.length === 0) {
                sourceLabs = Utilities.getSourceLabs(room);
            }

            if (!room.memory.labsInUse) {
                room.memory.labsInUse = [];
            }

            // Try to use labs other than source labs.
            labToUse = {
                id: _.filter(Cache.labsInRoom(room), (l) => _.map(room.memory.labsInUse, (lid) => liu.id).indexOf(l.id) === -1)[0].id,
                pause: false
            };

            // If only source labs are left, we will need to pause the reaction and use one of them.
            if (!labToUse.id) {
                labToUse.id = _.filter(sourceLabs, (l) => _.map(room.memory.labsInUse, (liu) => liu.id).indexOf(l) === -1)[0];
                labToUse.pause = true;
            }

            // If no labs can be used, then we can't boost.
            if (!labToUse.id) {
                return false;
            }

            return labToUse;
        }
    };

require("screeps-profiler").registerObject(Utilities, "Utilities");
module.exports = Utilities;
