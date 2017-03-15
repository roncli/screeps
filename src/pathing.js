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
    Segment = require("segment"),
    Pathing = {
        moveTo: (creep, pos, range) => {
            creep.memory._pathing = Pathing.move(creep, pos, range);
        },

        move: (creep, pos, range) => {
            "use strict";

            var pathing = creep.memory._pathing,
                restartOn = [],
                creepPos = creep.pos,
                creepX = creepPos.x,
                creepY = creepPos.y,
                creepRoom = creepPos.roomName,
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
                return undefined;
            }

            if (pathing) {
                // If the position doesn't match where we're going, nuke pathing.
                if (pathing.dest.x !== posX || pathing.dest.y !== posY || pathing.dest.room !== posRoom) {
                    pathing = undefined;
                }
            }

            // If we're in a room to restart the search on, clear the path.
            if (pathing && pathing.restartOn && pathing.restartOn.indexOf(creepRoom) !== -1) {
                delete pathing.path;
                delete pathing.restartOn;
            }

            // If we haven't moved in 2 turns, set the position to avoid, and then nuke pathing.path.
            if (pathing) {
                wasStationary = creepX === pathing.start.x && creepY === pathing.start.y && creepRoom === pathing.start.room;
                
                pathing.stationary = (wasStationary) ? pathing.stationary + 1 : 0;

                if (pathing.stationary >= 2) {
                    if (pathing.path && pathing.path.length > 0) {
                        let dir = direction[+pathing.path[0]];
                        
                        firstPos = {
                            x: creepX + dir.dx,
                            y: creepY + dir.dy,
                            room: creepRoom,
                            blockedUntil: tick + 12
                        };

                        if (firstPos.x !== creepX || firstPos.y !== creepY) {
                            if (!pathing.blocked) {
                                pathing.blocked = [];
                            }
                            pathing.blocked.push(firstPos);
                        }
                    }
                    delete pathing.path;
                    delete pathing.restartOn;
                } else if (pathing.path && !wasStationary) {
                    // We were successful moving last turn, update accordingly.
                    if (pathing.path.length === 1) {
                        // We've reached the end of the path.
                        pathing = undefined;
                    } else {
                        // Update start position and remaining path.
                        pathing.start = {
                            x: creepX,
                            y: creepY,
                            room: creepRoom
                        };
                        pathing.path = pathing.path.substring(1);
                    }
                }
            }
            
            // If we don't have a pathing, generate it.
            if (!pathing || !pathing.path) {
                let moveParts = creep.getActiveBodyparts(MOVE),
                    paths = new Segment(4);
                
                // Determine multiplier to use for terrain cost.
                multiplier = 1 + (_.filter(creep.body, (b) => b.hits > 0 && [MOVE, CARRY].indexOf(b.type) === -1).length + Math.ceil(_.sum(creep.carry) / 50) - moveParts) / moveParts;

                // Clean up blocked array.
                if (pathing && pathing.blocked) {
                    _.remove(pathing.blocked, (b) => b.blockedUntil <= tick);
                }

                key = creepRoom + "." + creepX + "." + creepY + "." + posRoom + "." + posX + "." + posY + "." + range + "." + (multiplier <= 1 ? "0" : "1");

                if ((!pathing || pathing.blocked.length === 0) && Memory.paths[key]) {
                    // Use the cache.
                    if (pathing) {
                        pathing.path = Memory.paths[key].path;
                        pathing.restartOn = Memory.paths[key].restartOn;
                    } else {
                        pathing = {
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
                    //paths.memory[key].lastUsed = tick;
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

                            if (pathing && roomName === creepRoom) {
                                _.forEach(pathing.blocked, (blocked) => {
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
                        return undefined;
                    }

                    // Serialize the path.
                    if (pathing) {
                        pathing.path = Pathing.serializePath(creepPos, path.path);
                        pathing.restartOn = restartOn;
                    } else {
                        pathing = {
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
                    if (pathing.blocked.length === 0) {
                        Memory.paths[key] = {
                            path: pathing.path,
                            firstUsed: tick,
                            lastUsed: tick
                        };
                        if (restartOn && restartOn.length > 0) {
                            Memory.paths[key].restartOn = restartOn;
                        }
                        /*
                        paths.memory[key] = {
                            path: pathing.path,
                            restartOn: restartOn,
                            firstUsed: tick,
                            lastUsed: tick
                        };
                        if (restartOn && restartOn.length > 0) {
                            paths.memory[key].restartOn = restartOn;
                        }
                        */
                    }
                }
            }

            // Attempt to move.
            if (creep.move(+pathing.path[0]) !== OK) {
                // We couldn't move, so don't penalize stationary movement.
                pathing.stationary -= 1;
            }

            return pathing;
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
