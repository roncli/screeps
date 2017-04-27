var Cache = require("cache");

class Commands {
    // Set the room type.  Options should be an object containing at least a type key.
    static setRoomType(name, options) {
        if (options === undefined) {
            delete Memory.rooms[name].roomType;
        } else {
            if (!Memory.rooms[name]) {
                Memory.rooms[name] = {};
            }
            Memory.rooms[name].roomType = options;
        }
    }

    static claimRoom(fromRoom, toRoom, claim) {
        if (!Memory.maxCreeps.claimer) {
            Memory.maxCreeps.claimer = {};
        }

        if (!Memory.maxCreeps.claimer[fromRoom]) {
            Memory.maxCreeps.claimer[fromRoom] = {};
        }
        
        if (claim) {
            Memory.maxCreeps.claimer[fromRoom][toRoom] = true;
        } else {
            delete Memory.maxCreeps.claimer[fromRoom][toRoom];
        }
    }

    static attackRoom(fromRoom, toRoom, attack) {
        if (!Memory.maxCreeps.converter) {
            Memory.maxCreeps.converter = {};
        }

        if (!Memory.maxCreeps.converter[fromRoom]) {
            Memory.maxCreeps.converter[fromRoom] = {};
        }
        
        if (attack) {
            Memory.maxCreeps.converter[fromRoom][toRoom] = true;
        } else {
            delete Memory.maxCreeps.converter[fromRoom][toRoom];
        }
    }

    // Claim a room that's currently being reserved.  Only works if you already have a reserver on the controller.
    static claimMine(room) {
        if (Game.rooms[room] && Cache.creeps[room]) {
            _.forEach(Cache.creeps[room].remoteReserver, (creep) => {
                creep.claimController(Game.rooms[room].controller);
            });
        }
    }

    static dismantle(x, y, room) {
        if (!Memory.dismantle) {
            Memory.dismantle = {};
        }

        if (!Memory.dismantle[room]) {
            Memory.dismantle[room] = [];
        }

        Memory.dismantle[room].push({x: x, y: y});
    }

    static stopCreep(name) {
        if (Game.creeps[name]) {
            Game.creeps[name].memory.stop = true;
        }
    }

    static startCreep(name) {
        if (Game.creeps[name]) {
            delete Game.creeps[name].memory.stop;
        }
    }

    static startAllCreeps() {
        _.forEach(Game.creeps, (creep) => {
            delete creep.memory.stop;
        });
    }

    // Set a container's source.  Useful when you want to have a container for a source be at a location different than default, ie: E36N11.
    static setContainerSource(containerId, sourceId) {
        Memory.containerSource[containerId] = sourceId;
    }

    // Adds an ally.  All creeps belonging to this user will not be attacked.
    static addAlly(name) {
        Memory.allies.push(name);
    }

    static removeAlly(name) {
        _.pull(Memory.allies, name);
    }

    static createArmy(army, options) {
        if (options === undefined) {
            delete Memory.army[army];
        } else {
            Memory.army[army] = options;
            Memory.army[army].directive = "preparing";
        }
    }

    static avoidRoom(room, avoid) {
        if (avoid && Memory.avoidRooms.indexOf(room) === -1) {
            Memory.avoidRooms.push(room);
        }
        if (!avoid) {
            _.remove(Memory.avoidRooms, (r) => r === room);
        }
    }

    static avoidSquare(x, y, room, avoid) {
        if (avoid) {
            if (!Memory.avoidSquares[room]) {
                Memory.avoidSquares[room] = [];
            }
            Memory.avoidSquares[room].push({x: x, y: y});
        }
        if (!avoid) {
            if (Memory.avoidSquares[room]) {
                _.remove(Memory.avoidSquares[room], (s) => s.x === x && s.y === y);
            }
        }
    }

    // Adds a sign to a room.  When a reserver or upgrader is near the controller, it will apply the sign.
    static addSign(room, text) {
        if (!Memory.signs) {
            Memory.signs = {};
        }
        if (text) {
            Memory.signs[room] = text;
        } else {
            delete Memory.signs[room];
        }
    }

    // Resets a wartime cost matrix for a room.  It will be automatically recalculated.
    static resetMatrix(room) {
        Memory.baseMatrixes[room] = {};
    }

    // Recover from an emergency.
    static recover() {
        _.forEach(Game.spawns, (spawn) => {spawn.createCreep([MOVE, MOVE, CARRY, CARRY, CARRY, CARRY], `storer-emerg-${spawn.room.name}-${spawn.name}`, {role: "storer", home: spawn.room.name})});
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Commands, "Commands");
}
module.exports = Commands;
