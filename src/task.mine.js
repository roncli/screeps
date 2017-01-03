var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities"),
    Mine = function(id) {
        Task.call(this);
        
        this.type = "mine";
        this.id = id;
        this.source = Game.getObjectById(id);
    };
    
Mine.prototype = Object.create(Task.prototype);
Mine.prototype.constructor = Mine;

Mine.prototype.canAssign = function(creep) {
    "use strict";

    var container = Game.getObjectById(creep.memory.container);

    if (creep.spawning || !container || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Mine.prototype.run = function(creep) {
    "use strict";

    var container = Game.getObjectById(creep.memory.container),
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

    // If we are at the container, get the source closest to the creep and attempt to harvest it.  Save it for future use.
    if (container.pos.x === creep.pos.x && container.pos.y === creep.pos.y && container.pos.roomName === creep.pos.roomName) {
        if (this.source) {
            source = this.source;
        } else if (Memory.containerSource[creep.memory.container]) {
            source = Game.getObjectById(Memory.containerSource[creep.memory.container]);
            this.id = source.id;
        } else {
            source = Utilities.objectsClosestToObj([].concat.apply([], [container.room.find(FIND_SOURCES), container.room.find(FIND_MINERALS)]), creep)[0];
            this.id = source.id;
        }

        if (source instanceof Mineral && source.mineralAmount === 0) {
            creep.say(":(", true);
            creep.suicide();
        }

        // If we're harvesting a mineral, don't go over 1500.
        if (source instanceof Mineral && _.sum(container.store) >= 1500) {
            return;
        }

        if (creep.harvest(source) === OK) {
            if (creep.room.memory.harvested === undefined) {
                creep.room.memory.harvested = 30000;
            }
            creep.room.memory.harvested += (creep.getActiveBodyparts(WORK) * 2);
        }

        // Suicide creep if there's another one right here with a higher TTL.
        if (_.filter([].concat.apply([], [Cache.creepsInRoom("miner", creep.room), Cache.creepsInRoom("remoteMiner", creep.room)]), (c) => c.room.name === creep.room.name && c.memory.container === creep.memory.container && c.pos.getRangeTo(creep) === 1 && c.ticksToLive > creep.ticksToLive && c.fatigue === 0).length > 0) {
            creep.say(":(", true);
            creep.suicide();
        }
    }
};

Mine.prototype.canComplete = function(creep) {
    "use strict";

    if (!Game.getObjectById(creep.memory.container) || creep.getActiveBodyparts(WORK) === 0) {
        return true;
    }
    return false;
};

Mine.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type,
        id: this.id
    }
};

Mine.fromObj = function(creep) {
    "use strict";

    return new Mine(creep.memory.currentTask.id);
};

require("screeps-profiler").registerObject(Mine, "TaskMine");
module.exports = Mine;
