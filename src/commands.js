var Cache = require("cache"),

    Commands = {
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
        defendRoom: (fromRoom, toRoom, maxDefenders, maxMelee, maxRanged, maxHealers) => {
            "use strict";

            if (!Memory.maxCreeps.defender) {
                Memory.maxCreeps.defender = {};
            }

            if (!Memory.maxCreeps.meleeAttack) {
                Memory.maxCreeps.meleeAttack = {};
            }

            if (!Memory.maxCreeps.rangedAttack) {
                Memory.maxCreeps.rangedAttack = {};
            }

            if (!Memory.maxCreeps.healer) {
                Memory.maxCreeps.healer = {};
            }

            if (!Memory.maxCreeps.defender[fromRoom]) {
                Memory.maxCreeps.defender[fromRoom] = {};
            }
            
            if (!Memory.maxCreeps.meleeAttack[fromRoom]) {
                Memory.maxCreeps.meleeAttack[fromRoom] = {};
            }
            
            if (!Memory.maxCreeps.rangedAttack[fromRoom]) {
                Memory.maxCreeps.rangedAttack[fromRoom] = {};
            }
            
            if (!Memory.maxCreeps.healer[fromRoom]) {
                Memory.maxCreeps.healer[fromRoom] = {};
            }
            
            if (maxDefenders === 0) {
                delete Memory.maxCreeps.defender[fromRoom][toRoom];
            } else {
                Memory.maxCreeps.defender[fromRoom][toRoom] = {
                    maxCreeps: maxDefenders
                };
            }
            
            if (maxMelee === 0) {
                delete Memory.maxCreeps.meleeAttack[fromRoom][toRoom];
            } else {
                Memory.maxCreeps.meleeAttack[fromRoom][toRoom] = {
                    maxCreeps: maxMelee
                };
            }
            
            if (maxRanged === 0) {
                delete Memory.maxCreeps.rangedAttack[fromRoom][toRoom];
            } else {
                Memory.maxCreeps.rangedAttack[fromRoom][toRoom] = {
                    maxCreeps: maxRanged
                };
            }
            
            if (maxHealers === 0) {
                delete Memory.maxCreeps.healer[fromRoom][toRoom];
            } else {
                Memory.maxCreeps.healer[fromRoom][toRoom] = {
                    maxCreeps: maxHealers
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
