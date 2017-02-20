const direction = {
    1: {dx: 0, dy: -1},
    2: {dx: 1, dy: -1},
    3: {dx: 1, dy: 0},
    4: {dx: 1, dy: 1},
    5: {dx: 0, dy: 1},
    6: {dx: -1, dy: 1},
    7: {dx: -1, dy: 0},
    8: {dx: -1, dy: -1}
};

var Cache = require("cache"),
    Pathing = {
        moveTo: (creep, pos, range) => {
            "use strict";

            var restartOn = [],
                creepPos = creep.pos,
                creepX = creepPos.x,
                creepY = creepPos.y,
                creepRoom = creepPos.roomName,
                creepMemory = creep.memory,
                tick = Game.time,
                posX, posY, posRoom, wasStationary, firstPos, multiplier, path, key;

            if (pos instanceof RoomObject) {
                pos = pos.pos;
            }
            
            posX = pos.x;
            posY = pos.y;
            posRoom = pos.roomName;

            // Default range to 0.
            if (!range) {
                range = 0;
            }

            // If creep is at the position, we're done.
            if (creepPos.getRangeTo(pos) <= range) {
                delete creepMemory._pathing;
                return;
            }

            if (creepMemory._pathing) {
                // If the position doesn't match where we're going, nuke _pathing.
                if (creepMemory._pathing.dest.x !== posX || creepMemory._pathing.dest.y !== posY || creepMemory._pathing.dest.room !== posRoom) {
                    delete creepMemory._pathing;
                }
            }

            // If we're in a room to restart the search on, clear the path.
            if (creepMemory._pathing && creepMemory._pathing.restartOn && creepMemory._pathing.restartOn.indexOf(creepRoom) !== -1) {
                delete creepMemory._pathing.path;
                delete creepMemory._pathing.restartOn;
            }

            // If we haven't moved in 2 turns, set the position to avoid, and then nuke _pathing.path.
            if (creepMemory._pathing) {
                wasStationary = creepX === creepMemory._pathing.start.x && creepY === creepMemory._pathing.start.y && creepRoom === creepMemory._pathing.start.room;
                
                creepMemory._pathing.stationary = (wasStationary) ? creepMemory._pathing.stationary + 1 : 0;

                if (creepMemory._pathing.stationary >= 2) {
                    if (creepMemory._pathing.path && creepMemory._pathing.path.length > 0) {
                        let dir = direction[+creepMemory._pathing.path[0]];
                        
                        firstPos = {
                            x: creepX + dir.dx,
                            y: creepY + dir.dy,
                            room: creepRoom,
                            blockedUntil: tick + 12
                        };

                        if (firstPos.x !== creepX || firstPos.y !== creepY) {
                            if (!creepMemory._pathing.blocked) {
                                creepMemory._pathing.blocked = [];
                            }
                            creepMemory._pathing.blocked.push(firstPos);
                        }
                    }
                    delete creepMemory._pathing.path;
                    delete creepMemory._pathing.restartOn;
                } else if (creepMemory._pathing.path && !wasStationary) {
                    // We were successful moving last turn, update accordingly.
                    if (creepMemory._pathing.path.length === 1) {
                        // We've reached the end of the path.
                        delete creepMemory._pathing;
                    } else {
                        // Update start position and remaining path.
                        creepMemory._pathing.start = {
                            x: creepX,
                            y: creepY,
                            room: creepRoom
                        };
                        creepMemory._pathing.path = creepMemory._pathing.path.substring(1);
                    }
                }
            }
            
            // If we don't have a _pathing, generate it.
            if (!creepMemory._pathing || !creepMemory._pathing.path) {
                let moveParts = creep.getActiveBodyparts(MOVE);
                
                // Determine multiplier to use for terrain cost.
                multiplier = 1 + (_.filter(creep.body, (b) => b.hits > 0 && [MOVE, CARRY].indexOf(b.type) === -1).length + Math.ceil(_.sum(creep.carry) / 50) - moveParts) / moveParts;

                // Clean up blocked array.
                if (creepMemory._pathing && creepMemory._pathing.blocked) {
                    _.remove(creepMemory._pathing.blocked, (b) => b.blockedUntil <= tick);
                }

                key = creepRoom + "." + creepX + "." + creepY + "." + posRoom + "." + posX + "." + posY + "." + range + "." + (multiplier <= 1 ? "0" : "1");

                if ((!creepMemory._pathing || creepMemory._pathing.blocked.length === 0) && Memory.paths[key]) {
                    // Use the cache.
                    if (creepMemory._pathing) {
                        creepMemory._pathing.path = Memory.paths[key].path;
                        creepMemory._pathing.restartOn = Memory.paths[key].restartOn;
                    } else {
                        creepMemory._pathing = {
                            start: {
                                x: creepX,
                                y: creepY,
                                room: creepRoom
                            },
                            dest: {
                                x: posX,
                                y: posY,
                                room: posRoom
                            },
                            path: Memory.paths[key].path,
                            stationary: 0,
                            blocked: [],
                            restartOn: Memory.paths[key].restartOn
                        };
                    }
                    Memory.paths[key].lastUsed = tick;
                } else {
                    path = PathFinder.search(creepPos, {pos: pos, range: range}, {
                        plainCost: Math.ceil(1 * multiplier),
                        swampCost: Math.ceil(5 * multiplier),
                        maxOps: creepRoom === posRoom ? 2000 : 100000,
                        roomCallback: (roomName) => {
                            var room = Game.rooms[roomName],
                                matrix;

                            // Avoid rooms that we are instructed to, or avoid other rooms if the target is in the same room and this creep is not a remote worker.
                            if (Memory.avoidRooms.indexOf(roomName) !== -1 || (creepRoom === posRoom && roomName !== posRoom && !creep.memory.role.startsWith("remote"))) {
                                return false;
                            }

                            if (!room) {
                                restartOn.push(roomName);
                                return;
                            }

                            matrix = Cache.getCostMatrix(room);

                            if (creepMemory._pathing && roomName === creepRoom) {
                                _.forEach(creepMemory._pathing.blocked, (blocked) => {
                                    if (roomName === blocked.room && tick < blocked.blockedUntil) {
                                        matrix.set(blocked.x, blocked.y, 255);
                                    }
                                });
                            }

                            return matrix;
                        }
                    });

                    if (!path.path || path.path.length === 0) {
                        // There is no path, just return.
                        return;
                    }

                    // Serialize the path.
                    if (creepMemory._pathing) {
                        creepMemory._pathing.path = Pathing.serializePath(creepPos, path.path);
                        creepMemory._pathing.restartOn = restartOn;
                    } else {
                        creepMemory._pathing = {
                            start: {
                                x: creepX,
                                y: creepY,
                                room: creepRoom
                            },
                            dest: {
                                x: posX,
                                y: posY,
                                room: posRoom
                            },
                            path: Pathing.serializePath(creepPos, path.path),
                            stationary: 0,
                            blocked: [],
                            restartOn: restartOn
                        };
                    }

                    // Cache serialized path
                    if (creepMemory._pathing.blocked.length === 0) {
                        Memory.paths[key] = {
                            path: creepMemory._pathing.path,
                            restartOn: restartOn,
                            firstUsed: tick,
                            lastUsed: tick
                        }
                    }
                }
            }

            // Attempt to move.
            if (creep.move(+creepMemory._pathing.path[0]) !== OK) {
                // We couldn't move, so don't penalize stationary movement.
                creepMemory._pathing.stationary -= 1;
            }
        },

        serializePath: (start, path) => {
            "use strict";

            return _.map(path, (pos, index) => {
                var startPos;

                if (index === 0) {
                    startPos = start;
                } else {
                    startPos = path[index - 1];
                }

                switch (pos.x - startPos.x) {
                    // Vertical movement
                    case 0:
                    case -49:
                    case 49:
                        switch (pos.y - startPos.y) {
                            // No movement
                            case 0:
                            case -49:
                            case 49:
                                return "";
                            // Down
                            case 1:
                            case -48:
                                return BOTTOM.toString();
                            // Up
                            case -1:
                            case 48:
                                return TOP.toString();
                        }
                        break;
                    // Right movement
                    case 1:
                    case -48:
                        switch (pos.y - startPos.y) {
                            // Right
                            case 0:
                            case -49:
                            case 49:
                                return RIGHT.toString();
                            // Down Right
                            case 1:
                            case -48:
                                return BOTTOM_RIGHT.toString();
                            // Up Right
                            case -1:
                            case 48:
                                return TOP_RIGHT.toString();
                        }
                        break;
                    // Left movement
                    case -1:
                    case 48:
                        switch (pos.y - startPos.y) {
                            // Left
                            case 0:
                            case -49:
                            case 49:
                                return LEFT.toString();
                            // Down Left
                            case 1:
                            case -48:
                                return BOTTOM_LEFT.toString();
                            // Up Left
                            case -1:
                            case 48:
                                return TOP_LEFT.toString();
                        }
                        break;
                }
            }).join("");
        }
    };

require("screeps-profiler").registerObject(Pathing, "Pathing");
module.exports = Pathing;
