var Cache = require("cache"),

    Commands = {
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

        // Set the room type.  Options should be an object containing at least a type key.
        setRoomType: (name, options) => {
            if (options === undefined) {
                delete Memory.rooms[name];
            } else {
                if (!Memory.rooms[name]) {
                    Memory.rooms[name] = {};
                }
                Memory.rooms[name].roomType = options;
            }
        }
    };

require("screeps-profiler").registerObject(Commands, "Commands");
module.exports = Commands;
