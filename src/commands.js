var Cache = require("cache"),

    Commands = {
        // Set the room type.  Options should be an object containing at least a type key.
        setRoomType: (name, options) => {
            "use strict";

            if (options === undefined) {
                delete Memory.rooms[name].roomType;
            } else {
                if (!Memory.rooms[name]) {
                    Memory.rooms[name] = {};
                }
                Memory.rooms[name].roomType = options;
            }
        },

        // Claim a room.
        claimRoom: (fromRoom, toRoom, claim) => {
            "use strict";

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
        },

        // Claim a room that's currently being reserved.  Only works if you already have a reserver on the controller.
        claimMine: (room) => {
            if (Game.rooms[room] && Cache.creeps[room]) {
                _.forEach(Cache.creeps[room].remoteReserver, (creep) => {
                    creep.claimController(Game.rooms[room].controller);
                });
            }
        },

        // Dismantle structures at a location.
        dismantle: (x, y, room) => {
            "use strict";

            if (!Memory.dismantle) {
                Memory.dismantle = {};
            }

            if (!Memory.dismantle[room]) {
                Memory.dismantle[room] = [];
            }

            Memory.dismantle[room].push({x: x, y: y});
        },

        // Stop a creep from moving.
        stopCreep: (name) => {
            if (Game.creeps[name]) {
                Game.creeps[name].memory.stop = true;
            }
        },

        // Start a creep moving again.
        startCreep: (name) => {
            if (Game.creeps[name]) {
                delete Game.creeps[name].memory.stop;
            }
        },

        // Start all creeps moving.
        startAllCreeps: () => {
            _.forEach(Game.creeps, (creep) => {
                delete creep.memory.stop;
            });
        },

        // Set a container's source.  Useful when you want to have a container for a source be at a location different than default.
        setContainerSource: (containerId, sourceId) => {
            Memory.containerSource[containerId] = sourceId;
        },

        // Adds an ally.  All creeps belonging to this user will not be attacked.
        addAlly: (name) => {
            if (!Memory.allies) {
                Memory.allies = [];
            }

            Memory.allies.push(name);
        },

        // Removes an ally.
        removeAlly: (name) => {
            _.pull(Memory.allies, name);
        },

        // Creates an army.  TODO: Better options.
        createArmy: (army, options) => {
            if (options === undefined) {
                delete Memory.army[army];
            } else {
                Memory.army[army] = options;
                Memory.army[army].directive = "preparing";
            }
        },

        // Avoids a room or not.
        avoidRoom: (room, avoid) => {
            if (avoid && Memory.avoidRooms.indexOf(room) === -1) {
                Memory.avoidRooms.push(room);
            }
            if (!avoid) {
                _.remove(Memory.avoidRooms, (r) => r === room);
            }
        },

        // Avoids a square or not.
        avoidSquare: (x, y, room, avoid) => {
            if (avoid) {
                if (!Memory.avoidSquares[room]) {
                    Memory.avoidSquares[room] === [];
                }
                Memory.avoidSquares[room].push({x: x, y: y});
            }
            if (!avoid) {
                if (Memory.avoidSquares[room]) {
                    _.remove(Memory.avoidSquares[room], (s) => s.x === x && s.y === y);
                }
            }
        },

        // Adds a sign to a room.  When a reserver or upgrader is near the controller, it will apply the sign.
        addSign: (room, text) => {
            if (!Memory.signs) {
                Memory.signs = {};
            }
            if (text) {
                Memory.signs[room] = text;
            } else {
                delete Memory.signs[room];
            }
        },
        
        // Resets a wartime cost matrix for a room.  It will be automatically recalculated.
        resetMatrix: (room) => {
            Memory.baseMatrixes[room] = {};
        },

        // Recover from an emergency.
        recover: () => {
            _.forEach(Game.spawns, (spawn) => {spawn.createCreep([MOVE, MOVE, CARRY, CARRY, CARRY, CARRY], "storer-emerg-" + spawn.room.name, {role: "storer", home: spawn.room.name})});            
        }
    };

require("screeps-profiler").registerObject(Commands, "Commands");
module.exports = Commands;
