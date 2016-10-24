var Task = require("task"),
    Cache = require("cache"),
    Harvest = function() {
        Task.call(this);
        
        this.type = "harvest";
    };
    
Harvest.prototype = Object.create(Task.prototype);
Harvest.prototype.constructor = Harvest;

Harvest.prototype.canAssign = function(creep) {
    "use strict";

    var source = Cache.getObjectById(creep.memory.homeSource);

    if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || (!source && creep.memory.role !== "delivery") || (source && source.energy === 0) || creep.getActiveBodyparts(WORK) === 0) {
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
    if ((!source && creep.memory.role !== "delivery") || (source && source.energy === 0)) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Harvest the source, or move closer to it if not in range.
    if (source) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {reusePath: Math.floor(Math.random() * 2) + 4});
        }
    } else {
        pos = Memory.maxCreeps.delivery[creep.memory.home][creep.memory.homeSource].fromPos;
        creep.moveTo(new RoomPosition(pos.x, pos.y, pos.roomName), {reusePath: Math.floor(Math.random() * 2) + 4});
    }
};

Harvest.prototype.canComplete = function(creep) {
    "use strict";

    var source = Cache.getObjectById(creep.memory.homeSource);

    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || (!source && creep.memory.role !== "delivery") || (source && source.energy === 0)) {
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
