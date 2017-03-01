var Task = require("task"),
    Pathing = require("pathing"),
    Harvest = function(failIn, source) {
        "use strict";
        
        this.init(failIn, source);
    };
    
Harvest.prototype = Object.create(Task.prototype);
Harvest.prototype.constructor = Harvest;

Harvest.prototype.init = function(failIn, source) {
    "use strict";
    
    Task.call(this);
    
    this.type = "harvest";
    this.failIn = failIn || 10;
    this.source = source;
};

Harvest.prototype.canAssign = function(creep) {
    "use strict";

    var source = Game.getObjectById(creep.memory.homeSource);

    if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }

    if (source.energy === 0) {
        source = creep.room.find(FIND_SOURCES_ACTIVE)[0];
        if (!source) {
            return false;
        }
    }

    this.source = source.id;
    
    Task.prototype.assign.call(this, creep);
    return true;
};

Harvest.prototype.run = function(creep) {
    "use strict";

    var source = Game.getObjectById(this.source || creep.memory.homeSource);
    
    // No sources found or the source is drained, or creep is about to die or out of WORK parts, complete task.
    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || source.energy === 0 || creep.getActiveBodyparts(WORK) === 0) {
        delete creep.memory.currentTask;
        return;
    }
    
    // Move to the source and harvest it.
    Pathing.moveTo(creep, source, 1);
    if (creep.harvest(source) === OK) {
        if (Memory.rooms[creep.room.name].harvested === undefined) {
            Memory.rooms[creep.room.name].harvested = 30000;
        }
        Memory.rooms[creep.room.name].harvested += (creep.getActiveBodyparts(WORK) * 2);
    } else {
        this.failIn--;
        if (this.failIn === 0) {
            delete creep.memory.currentTask;
        }
    }
};

Harvest.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type,
        failIn: this.failIn,
        source: this.source
    };
};

Harvest.fromObj = function(creep) {
    "use strict";

    return new Harvest(creep.memory.currentTask.failIn, creep.memory.currentTask.source);
};

require("screeps-profiler").registerObject(Harvest, "TaskHarvest");
module.exports = Harvest;
