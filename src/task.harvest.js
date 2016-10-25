var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Harvest = function() {
        Task.call(this);
        
        this.type = "harvest";
    };
    
Harvest.prototype = Object.create(Task.prototype);
Harvest.prototype.constructor = Harvest;

Harvest.prototype.canAssign = function(creep) {
    "use strict";

    var source = Cache.getObjectById(creep.memory.homeSource);

    if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || source.energy === 0 || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Harvest.prototype.run = function(creep) {
    "use strict";

    var source = Cache.getObjectById(creep.memory.homeSource),
        pos;
    
    // No sources found or the source is drained, complete task.
    if (!source || source.energy === 0) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Move to the source and harvest it.
    Pathing.moveTo(creep, source, 1);
    creep.harvest(source);
};

Harvest.prototype.canComplete = function(creep) {
    "use strict";

    var source = Cache.getObjectById(creep.memory.homeSource);

    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || source.energy === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Harvest.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type
    }
};

Harvest.fromObj = function(creep) {
    "use strict";

    return new Harvest();
};

require("screeps-profiler").registerObject(Harvest, "TaskHarvest");
module.exports = Harvest;
