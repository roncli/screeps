var Cache = require("cache"),

    Utilities = {
        nest: (seq, keys) => {
            if (!keys.length) {
                return seq;
            }

            return _.mapValues(_.groupBy(seq, keys[0]), function (value) { 
                return Utilities.nest(value, keys.slice(1));
            });
        },
        
        creepsWithNoTask: (creeps) => {
            "use strict";

            return _.filter(creeps, (c) => !c.memory.currentTask || c.memory.currentTask.unimportant);
        },

        objectsClosestToObj: (objects, obj) => {
            "use strict";

            var objId = obj.id;

            if (objects.length === 0) {
                return [];
            }

            if (!obj) {
                return objects;
            }
            
            var objList = _.map(objects, (o) => {
                var oId = o.id,
                    range;
                
                if (Memory.ranges && Memory.ranges[objId] && Memory.ranges[objId][oId]) {
                    range = Memory.ranges[objId][oId];
                } else {
                    range = obj.pos.getRangeTo(o);
                    if (!(o instanceof Creep) && !(obj instanceof Creep)) {
                        if (!Memory.ranges) {
                            Memory.ranges = {};
                        }
                        if (!Memory.ranges[objId]) {
                            Memory.ranges[objId] = {};
                        }
                        Memory.ranges[objId][oId] = range;
                    }
                }

                return {
                    object: o,
                    distance: range
                };
            });
            
            objList.sort((a, b) => a.distance - b.distance);
            
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
                x = pos.x,
                y = pos.y,
                roomName = pos.roomName,
                room = Game.rooms[roomName],
                structures;
            
            // Cannot be a wall or have walls on opposite sides.
            if (
                new RoomPosition(x, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" ||
                (
                    new RoomPosition(x - 1, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" &&
                    new RoomPosition(x + 1, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall"
                ) ||
                (
                    new RoomPosition(x, y - 1, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" &&
                    new RoomPosition(x, y + 1, roomName).lookFor(LOOK_TERRAIN)[0] === "wall"
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
            if (pos.getRangeTo(room.controller) <= 4) {
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
            "use strict";

            var distanceFromSpawn = 1,
                buildAroundPos = buildAroundObj.pos,
                buildAroundx = buildAroundPos.x,
                buildAroundy = buildAroundPos.y,
                x, y, siteIsClear;

            while (structuresToBuild > 0 && distanceFromSpawn < 50) {
                for (x = buildAroundx - distanceFromSpawn; x <= buildAroundx + distanceFromSpawn; x += 2) {
                    for (y = buildAroundy - distanceFromSpawn; y <= buildAroundy + distanceFromSpawn; y += (Math.abs(buildAroundx - x) === distanceFromSpawn ? 2 : 2 * distanceFromSpawn)) {
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
            "use strict";

            return _.sum(_.map(body, (b) => BODYPART_COST[b]));
        },

        getSourceLabs: (room) => {
            "use strict";

            var labs = Cache.labsInRoom(room),
                sourceLabs = [];

            _.forEach(labs, (lab) => {
                if (Utilities.objectsClosestToObj(labs, lab)[labs.length - 1].pos.getRangeTo(lab) <= 2) {
                    sourceLabs.push(lab.id);
                    if (sourceLabs.length >= 2) {
                        return false;
                    }
                }
            });

            return sourceLabs;
        },

        getLabToBoostWith: (room, count) => {
            "use strict";

            var labQueue = room.memory.labQueue,
                sourceLabs = (labQueue && labQueue.sourceLabs) ? labQueue.sourceLabs : [],
                labs = [],
                labToUse = null,
                lab, labUsed;

            if (!count) {
                count = 1;
            }

            if (sourceLabs.length === 0) {
                sourceLabs = Utilities.getSourceLabs(room);
            }

            if (!room.memory.labsInUse) {
                room.memory.labsInUse = [];
            }

            for (let index = 0; index < count; index++) {
                // Try to use labs other than source labs.
                labToUse = {};
                lab = _.filter(Cache.labsInRoom(room), (l) => sourceLabs.indexOf(l.id) === -1 && _.map(room.memory.labsInUse, (liu) => liu.id).indexOf(l.id) === -1 && _.map(labs, (liu) => liu.id).indexOf(l.id) === -1);

                if (lab.length > 0) {
                    labToUse = {
                        id: lab[0].id,
                        pause: false
                    };
                }

                // If only source labs are left, we will need to pause the reaction and use one of them.
                if (!labToUse || !labToUse.id) {
                    labToUse = {
                        id: _.filter(sourceLabs, (l) => _.map(room.memory.labsInUse, (liu) => liu.id).indexOf(l) === -1 && _.map(labs, (liu) => liu.id).indexOf(l) === -1)[0],
                        pause: true
                    }
                    
                    if (!labToUse.id) {
                        return false;
                    }
                    labUsed = Game.getObjectById(labToUse.id);
                    if (labUsed.mineralAmount > 0) {
                        labToUse.status = "emptying";
                        labToUse.oldResource = labUsed.mineralType;
                        labToUse.oldAmount = labUsed.mineralAmount;
                    }
                }

                // If no labs can be used, then we can't boost.
                if (!labToUse.id) {
                    return false;
                }

                labs.push(labToUse);
            }

            return labs;
        },

        roomLabsArePaused: (room) => {
            "use strict";

            return room.memory.labsInUse && _.filter(room.memory.labsInUse, (l) => l.pause).length > 0;
        }
    };

require("screeps-profiler").registerObject(Utilities, "Utilities");
module.exports = Utilities;
