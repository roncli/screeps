var Cache = require("cache"),

    Commands = {
        // Set a number of creeps to deliver energy from a specific location.
        deliverEnergy: (fromId, fromX, fromY, fromRoomName, toRoom, maxCreeps) => {
            "use strict";

            if (!Memory.maxCreeps.delivery) {
                Memory.maxCreeps.delivery = {};
            }

            if (!Memory.maxCreeps.delivery[toRoom]) {
                Memory.maxCreeps.delivery[toRoom] = {};
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

        // Set the room type.  Options should be an object containing at least a type key.
        setRoomType: (name, options) => {
            "use strict";

            if (options === undefined) {
                delete Memory.rooms[name];
            } else {
                if (!Memory.rooms[name]) {
                    Memory.rooms[name] = {};
                }
                Memory.rooms[name].roomType = options;
            }
        },

        // Defend a room.
        defendRoom: (fromRoom, toRoom, maxCreeps) => {
            "use strict";

            if (!Memory.maxCreeps.defender) {
                Memory.maxCreeps.defender = {};
            }

            if (!Memory.maxCreeps.defender[fromRoom]) {
                Memory.maxCreeps.defender[fromRoom] = {};
            }
            
            if (maxCreeps === 0) {
                delete Memory.maxCreeps.defender[fromRoom][toRoom];
            } else {
                Memory.maxCreeps.defender[fromRoom][toRoom] = {
                    maxCreeps: maxCreeps
                };
            }
        },

        // Reserve a room.
        reserveRoom: (fromRoom, toRoom, reserve) => {
            "use strict";

            if (!Memory.maxCreeps.reserver) {
                Memory.maxCreeps.reserver = {};
            }

            if (!Memory.maxCreeps.reserver[fromRoom]) {
                Memory.maxCreeps.reserver[fromRoom] = {};
            }
            
            if (reserve) {
                Memory.maxCreeps.reserver[fromRoom][toRoom] = true;
            } else {
                delete Memory.maxCreeps.reserver[fromRoom][toRoom];
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
        }
    };

require("screeps-profiler").registerObject(Commands, "Commands");
module.exports = Commands;
