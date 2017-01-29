var Task = require("task"),
    Pathing = require("pathing"),
    Harvest = function(failIn) {
        "use strict";
        
        this.init(failIn);
    };
    
Harvest.prototype = Object.create(Task.prototype);
Harvest.prototype.constructor = Harvest;

Harvest.prototype.init = function(failIn) {
    "use strict";
    
    Task.call(this);
    
    this.type = "harvest";
    this.failIn = failIn || 10;
};

Harvest.prototype.canAssign = function(creep) {
    "use strict";

    var source = Game.getObjectById(creep.memory.homeSource);

    if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }

    if (source.energy === 0) {
        source = creep.room.find(FIND_SOURCES_ACTIVE)[0]
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
    
    // No sources found or the source is drained, complete task.
    if (!source || source.energy === 0) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Move to the source and harvest it.
    Pathing.moveTo(creep, source, 1);
    if (creep.harvest(source) === OK) {
        if (creep.room.memory.harvested === undefined) {
            creep.room.memory.harvested = 30000;
        }
        creep.room.memory.harvested += (creep.getActiveBodyparts(WORK) * 2);
    } else {
        this.failIn--;
        if (this.failIn === 0) {
            Task.prototype.assign.call(this, creep);
        }
    }
};

Harvest.prototype.canComplete = function(creep) {
    "use strict";

    var source = Game.getObjectById(creep.memory.homeSource);

    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || source.energy === 0 || creep.getActiveBodyparts(WORK) === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Harvest.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type,
        failIn: this.failIn
    };
};

Harvest.fromObj = function(creep) {
    "use strict";

    return new Harvest(creep.memory.currentTask.failIn);
};

require("screeps-profiler").registerObject(Harvest, "TaskHarvest");
module.exports = Harvest;
