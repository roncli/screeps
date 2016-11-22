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

            var begin = Game.cpu.getUsed();

            var ret = (() => {
                var restartOn = [],
                    wasStationary, firstPos, multiplier, path, key;

                if (pos instanceof RoomObject) {
                    pos = pos.pos;
                }

                // Default range to 0.
                if (!range) {
                    range = 0;
                }

                // If creep is at the position, we're done.
                if (creep.pos.getRangeTo(pos) <= range) {
                    delete creep.memory._pathing;
                    return;
                }

                if (creep.memory._pathing) {
                    // If the position doesn't match where we're going, nuke _pathing.
                    if (creep.memory._pathing.dest.x !== pos.x || creep.memory._pathing.dest.y !== pos.y || creep.memory._pathing.dest.room !== pos.roomName) {
                        delete creep.memory._pathing;
                    }
                }

                // If we're in a room to restart the search on, clear the path.
                if (creep.memory._pathing && creep.memory._pathing.restartOn && creep.memory._pathing.restartOn.indexOf(creep.room.name) !== -1) {
                    delete creep.memory._pathing.path;
                    delete creep.memory._pathing.restartOn;
                }

                // If we haven't moved in 2 turns, set the position to avoid, and then nuke _pathing.path.
                if (creep.memory._pathing) {
                    wasStationary = creep.pos.x === creep.memory._pathing.start.x && creep.pos.y === creep.memory._pathing.start.y && creep.room.name === creep.memory._pathing.start.room;
                    
                    creep.memory._pathing.stationary = (wasStationary) ? creep.memory._pathing.stationary + 1 : 0;

                    if (creep.memory._pathing.stationary >= 2) {
                        if (creep.memory._pathing.path && creep.memory._pathing.path.length > 0) {
                            firstPos = {
                                x: creep.pos.x + direction[+creep.memory._pathing.path[0]].dx,
                                y: creep.pos.y + direction[+creep.memory._pathing.path[0]].dy,
                                room: creep.room.name,
                                blockedUntil: Game.time + 12
                            };

                            if (firstPos.x !== creep.pos.x || firstPos.y !== creep.pos.y) {
                                if (!creep.memory._pathing.blocked) {
                                    creep.memory._pathing.blocked = [];
                                }
                                creep.memory._pathing.blocked.push(firstPos);
                            }
                        }
                        delete creep.memory._pathing.path;
                        delete creep.memory._pathing.restartOn;
                    } else if (creep.memory._pathing.path && !wasStationary) {
                        // We were successful moving last turn, update accordingly.
                        if (creep.memory._pathing.path.length === 1) {
                            // We've reached the end of the path.
                            delete creep.memory._pathing;
                        } else {
                            // Update start position and remaining path.
                            creep.memory._pathing.start = {
                                x: creep.pos.x,
                                y: creep.pos.y,
                                room: creep.room.name
                            };
                            creep.memory._pathing.path = creep.memory._pathing.path.substring(1);
                        }
                    }
                }
                
                // If we don't have a _pathing, generate it.
                if (!creep.memory._pathing || !creep.memory._pathing.path) {
                    key = creep.pos.roomName + "." + creep.pos.x + "." + creep.pos.y + "." + pos.roomName + "." + pos.x + "." + pos.y + "." + range;

                    if ((!creep.memory._pathing || creep.memory._pathing.blocked.length === 0) && Memory.paths[key]) {
                        // Use the cache.
                        if (creep.memory._pathing) {
                            creep.memory._pathing.path = Memory.paths[key].path;
                            creep.memory._pathing.restartOn = Memory.paths[key].restartOn;
                        } else {
                            creep.memory._pathing = {
                                start: {
                                    x: creep.pos.x,
                                    y: creep.pos.y,
                                    room: creep.room.name
                                },
                                dest: {
                                    x: pos.x,
                                    y: pos.y,
                                    room: pos.roomName
                                },
                                path: Memory.paths[key].path,
                                stationary: 0,
                                blocked: [],
                                restartOn: Memory.paths[key].restartOn
                            };
                        }
                    } else {
                        // Determine multiplier to use for terrain cost.
                        multiplier = 1 + (_.filter(creep.body, (b) => b.hits > 0 && [MOVE, CARRY].indexOf(b.type) === -1).length + Math.ceil(_.sum(creep.carry) / 50) - creep.getActiveBodyparts(MOVE)) / creep.getActiveBodyparts(MOVE);

                        path = PathFinder.search(creep.pos, {pos: pos, range: range}, {
                            plainCost: Math.ceil(1 * multiplier),
                            swampCost: Math.ceil(5 * multiplier),
                            maxOps: creep.pos.roomName === pos.roomName ? 2000 : 100000,
                            roomCallback: (roomName) => {
                                var matrix;

                                if (Memory.avoidRooms.indexOf(roomName) !== -1) {
                                    return false;
                                }

                                if (!Game.rooms[roomName]) {
                                    restartOn.push(roomName);
                                    return;
                                }

                                matrix = Cache.getCostMatrix(Game.rooms[roomName]);

                                if (creep.memory._pathing && roomName === creep.room.name) {
                                    _.forEach(creep.memory._pathing.blocked, (blocked) => {
                                        if (roomName === blocked.room && Game.time < blocked.blockedUntil) {
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
                        if (creep.memory._pathing) {
                            creep.memory._pathing.path = Pathing.serializePath(creep.pos, path.path)
                            creep.memory._pathing.restartOn = restartOn;
                        } else {
                            creep.memory._pathing = {
                                start: {
                                    x: creep.pos.x,
                                    y: creep.pos.y,
                                    room: creep.room.name
                                },
                                dest: {
                                    x: pos.x,
                                    y: pos.y,
                                    room: pos.roomName
                                },
                                path: Pathing.serializePath(creep.pos, path.path),
                                stationary: 0,
                                blocked: [],
                                restartOn: restartOn
                            };
                        }

                        // Cache serialized path
                        if (creep.memory._pathing.path.blocked.length === 0) {
                            Memory.paths[key] = {
                                path: creep.memory._pathing.path,
                                restartOn: restartOn,
                                firstUsed: Game.time,
                                lastUsed: Game.time
                            }
                        }
                    }
                }

                // Attempt to move.
                if (creep.move(+creep.memory._pathing.path[0]) !== OK) {
                    // We couldn't move, so don't penalize stationary movement.
                    creep.memory._pathing.stationary -= 1;
                }
            })();

            var elapsed = Game.cpu.getUsed() - begin;

            if (elapsed > 0.3) {
                Cache.log.events.push("Move CPU: " + elapsed.toFixed(2) + " " + creep.room.name + "." + creep.pos.x + "." + creep.pos.y + " to " + pos.roomName + "." + pos.x + "." + pos.y + " " + creep.name + " " + creep.memory.role + " " + creep.memory.currentTask.type);
            }

            return ret;
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
