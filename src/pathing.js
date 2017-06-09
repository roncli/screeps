const Cache = require("cache"),
//    Segment = require("segment"),
    direction = {
        1: {dx: 0, dy: -1},
        2: {dx: 1, dy: -1},
        3: {dx: 1, dy: 0},
        4: {dx: 1, dy: 1},
        5: {dx: 0, dy: 1},
        6: {dx: -1, dy: 1},
        7: {dx: -1, dy: 0},
        8: {dx: -1, dy: -1}
    };

//  ####           #     #        #
//  #   #          #     #
//  #   #   ###   ####   # ##    ##    # ##    ## #
//  ####       #   #     ##  #    #    ##  #  #  #
//  #       ####   #     #   #    #    #   #   ##
//  #      #   #   #  #  #   #    #    #   #  #
//  #       ####    ##   #   #   ###   #   #   ###
//                                            #   #
//                                             ###
/**
 * A class for efficient creep pathing.
 */
class Pathing {
    //                         ###
    //                          #
    // # #    ##   # #    ##    #     ##
    // ####  #  #  # #   # ##   #    #  #
    // #  #  #  #  # #   ##     #    #  #
    // #  #   ##    #     ##    #     ##
    /**
     * Moves a creep to a position.
     * @param {Creep} creep The creep to move.
     * @param {object} pos The position or object to path to.
     * @param {number} [range=0] The range to path within.
     * @param {bool} [flee=false] Whether to flee from the position.
     * @return {void}
     */
    static moveTo(creep, pos, range, flee) {
        const {memory: creepMemory, pos: creepPos} = creep,
            {x: creepX, y: creepY, roomName: creepRoom} = creepPos,
            {time: tick} = Game,
            restartOn = [];
        let {_pathing: pathing} = creepMemory,
            wasStationary, firstPos, multiplier;

        if (pos instanceof RoomObject) {
            ({pos} = pos);
        }

        // Default range to 0.
        if (!range) {
            range = 0;
        }

        // If creep is at the position, we're done.
        if (creepPos.getRangeTo(pos) <= range) {
            return;
        }

        const {x: posX, y: posY, roomName: posRoom} = pos;

        if (pathing) {
            // If the position doesn't match where we're going, nuke pathing.
            if (pathing.dest.x !== posX || pathing.dest.y !== posY || pathing.dest.room !== posRoom) {
                delete creepMemory._pathing;
                pathing = void 0;
            }
        }

        // If we're in a room to restart the search on, clear the path.
        if (pathing && pathing.restartOn && pathing.restartOn.indexOf(creepRoom) !== -1) {
            delete pathing.path;
            delete pathing.restartOn;
        }

        // If we haven't moved in 2 turns, set the position to avoid, and then nuke pathing.path.
        if (pathing) {
            wasStationary = creepX === pathing.start.x && creepY === pathing.start.y && creepRoom === pathing.start.room || (Math.abs(creepX - pathing.start.x) === 49 || Math.abs(creepY - pathing.start.y) === 49) && creepRoom !== pathing.start.room;

            pathing.stationary = wasStationary ? pathing.stationary + 1 : 0;

            if (pathing.stationary >= 2) {
                if (pathing.path && pathing.path.length > 0) {
                    const {[+pathing.path[0]]: dir} = direction;

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

                pathing.stationary = 0;

                delete pathing.path;
                delete pathing.restartOn;
            } else if (pathing.path && !wasStationary) {
                // We were successful moving last turn, update accordingly.
                if (pathing.path.length === 1) {
                    // We've reached the end of the path.
                    delete creepMemory._pathing;
                    pathing = void 0;
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
            const moveParts = creep.getActiveBodyparts(MOVE),
//                paths = new Segment(4).memory;
                {paths} = Memory;
            let newPath;

            // Determine multiplier to use for terrain cost.
            multiplier = 1 + (_.filter(creep.body, (b) => b.hits > 0 && [MOVE, CARRY].indexOf(b.type) === -1).length + Math.ceil(_.sum(creep.carry) / 50) - moveParts) / moveParts;

            // Clean up blocked array.
            if (pathing && pathing.blocked) {
                _.remove(pathing.blocked, (b) => b.blockedUntil <= tick);
            }

            const key = `${creepRoom}.${creepX}.${creepY}.${posRoom}.${posX}.${posY}.${range}.${multiplier <= 1 ? 0 : 1}`,
                {[key]: path} = paths;

            if ((!pathing || pathing.blocked.length === 0) && path && !flee) {
                // Use the cache.
                if (pathing) {
                    pathing.path = this.decodePath(path[0]);
                    ({1: pathing.restartOn} = path);
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
                        path: this.decodePath(path[0]),
                        stationary: 0,
                        blocked: [],
                        restartOn: path[1]
                    };
                }
                path[3] = tick;
            } else {
                newPath = PathFinder.search(creepPos, {pos, range}, {
                    plainCost: Math.ceil(1 * multiplier),
                    swampCost: Math.ceil(5 * multiplier),
                    flee,
                    maxOps: creepRoom === posRoom ? 2000 : 100000,
                    roomCallback: (roomName) => {
                        const {rooms: {[roomName]: room}} = Game;

                        // Avoid rooms that we are instructed to, or avoid other rooms if the target is in the same room and this creep is not a remote worker or army creep.
                        if (creepRoom !== roomName && (Memory.avoidRooms.indexOf(roomName) !== -1 || creepRoom === posRoom && roomName !== posRoom && !creepMemory.role.startsWith("remote") && !creepMemory.role.startsWith("army"))) {
                            return false;
                        }

                        if (!room) {
                            restartOn.push(roomName);

                            return true;
                        }

                        const matrix = Cache.costMatrixForRoom(room);

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

                if (!newPath.path || newPath.path.length === 0) {
                    // There is no path, just return.
                    return;
                }

                // Serialize the path.
                if (pathing) {
                    pathing.path = this.serializePath(creepPos, newPath.path);
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
                        path: this.serializePath(creepPos, newPath.path),
                        stationary: 0,
                        blocked: [],
                        restartOn
                    };
                }

                // Cache serialized path
                if (pathing.blocked.length === 0 && pathing.path.length > 10 && !flee) {
                    paths[key] = [this.encodePath(pathing.path), [], tick, tick];
                    if (restartOn && restartOn.length > 0) {
                        paths[key][1] = restartOn;
                    }
                }
            }
        }

        // Attempt to move.
        if (creep.move(+pathing.path[0]) !== OK) {
            // We couldn't move, so don't penalize stationary movement.
            pathing.stationary -= 1;
        }

        creepMemory._pathing = pathing;
    }

    //                     #          ##     #                ###          #    #
    //                                 #                      #  #         #    #
    //  ###    ##   ###   ##     ###   #    ##    ####   ##   #  #   ###  ###   ###
    // ##     # ##  #  #   #    #  #   #     #      #   # ##  ###   #  #   #    #  #
    //   ##   ##    #      #    # ##   #     #     #    ##    #     # ##   #    #  #
    // ###     ##   #     ###    # #  ###   ###   ####   ##   #      # #    ##  #  #
    /**
     * Serializes the path to a string.
     * @param {RoomPosition} start The starting location of the path.
     * @param {RoomPosition[]} path Every location along the path.
     * @return {string} A serialized path.
     */
    static serializePath(start, path) {
        return _.map(path, (pos, index) => {
            let startPos;

            if (index === 0) {
                startPos = start;
            } else {
                ({[index - 1]: startPos} = path);
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

            return "";
        }).join("");
    }

    //                            #        ###          #    #
    //                            #        #  #         #    #
    //  ##   ###    ##    ##    ###   ##   #  #   ###  ###   ###
    // # ##  #  #  #     #  #  #  #  # ##  ###   #  #   #    #  #
    // ##    #  #  #     #  #  #  #  ##    #     # ##   #    #  #
    //  ##   #  #   ##    ##    ###   ##   #      # #    ##  #  #
    /**
     * Encodes a path to reduce size by ~50%.
     * @param {string} path The path to encode.
     * @return {string} The encoded path.
     */
    static encodePath(path) {
        const codes = [];
        let index;

        for (index = 0; index < path.length; index += 2) {
            if (index === path.length - 1) {
                codes.push(path.charCodeAt(index) - 17);
            } else {
                codes.push((path.charCodeAt(index) - 49) * 8 + (path.charCodeAt(index + 1) - 49) + 40);
            }
        }

        return String.fromCharCode(...codes);
    }

    //    #                       #        ###          #    #
    //    #                       #        #  #         #    #
    //  ###   ##    ##    ##    ###   ##   #  #   ###  ###   ###
    // #  #  # ##  #     #  #  #  #  # ##  ###   #  #   #    #  #
    // #  #  ##    #     #  #  #  #  ##    #     # ##   #    #  #
    //  ###   ##    ##    ##    ###   ##   #      # #    ##  #  #
    /**
     * Decodes an encoded path.
     * @param {string} path The path to decode.
     * @return {string} The decoded path.
     */
    static decodePath(path) {
        const codes = [];
        let index;

        for (index = 0; index < path.length; index++) {
            const char = path.charCodeAt(index);

            if (char < 40) {
                codes.push(char + 17);
            } else {
                codes.push(Math.floor((char - 40) / 8) + 49);
                codes.push((char - 40) % 8 + 49);
            }
        }

        return String.fromCharCode(...codes);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Pathing, "Pathing");
}
module.exports = Pathing;
