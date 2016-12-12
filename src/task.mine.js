var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities"),
    Mine = function() {
        Task.call(this);
        
        this.type = "mine";
    };
    
Mine.prototype = Object.create(Task.prototype);
Mine.prototype.constructor = Mine;

Mine.prototype.canAssign = function(creep) {
    "use strict";

    var container = Cache.getObjectById(creep.memory.container);

    if (creep.spawning || !container || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Mine.prototype.run = function(creep) {
    "use strict";

    var container = Cache.getObjectById(creep.memory.container),
        source;
    
    // Container is not found, complete the task.
    if (!container) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Move to the container if we are not there.
    if (container.pos.x !== creep.pos.x || container.pos.y !== creep.pos.y || container.pos.roomName !== creep.pos.roomName) {
        Pathing.moveTo(creep, container, 0);
    }

    // If we are at the container, get the source closest to the creep and attempt to harvest it.
    if (container.pos.x === creep.pos.x && container.pos.y === creep.pos.y && container.pos.roomName === creep.pos.roomName) {
        if (Memory.containerSource[creep.memory.container]) {
            source = Cache.getObjectById(Memory.containerSource[creep.memory.container]);
        } else {
            source = Utilities.objectsClosestToObj([].concat.apply([], [container.room.find(FIND_SOURCES), container.room.find(FIND_MINERALS)]), creep)[0];
        }

        // If we're harvesting a mineral, don't go over 1500.
        if (source instanceof Mineral && _.sum(container.store) >= 1500) {
            return;
        }

        creep.harvest(source);

        // Suicide creep if there's another one right here with a higher TTL.
        if (_.filter([].concat.apply([], [Cache.creepsInRoom("miner", creep.room), Cache.creepsInRoom("remoteMiner", creep.room)]), (c) => c.room.name === creep.room.name && c.memory.container === creep.memory.container && c.pos.getRangeTo(creep) === 1 && c.ticksToLive > creep.ticksToLive && c.fatigue === 0).length > 0) {
            creep.say(":(", true);
            creep.suicide();
        }
    }
};

Mine.prototype.canComplete = function(creep) {
    "use strict";

    if (!Cache.getObjectById(creep.memory.container) || creep.getActiveBodyparts(WORK) === 0) {
        return true;
    }
    return false;
};

Mine.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type
    }
};

Mine.fromObj = function(creep) {
    "use strict";

    return new Mine();
};

require("screeps-profiler").registerObject(Mine, "TaskMine");
module.exports = Mine;
