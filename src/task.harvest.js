var Task = require("task"),
    Cache = require("cache"),
    Harvest = function() {
        Task.call(this);
        
        this.type = "harvest";
    };
    
Harvest.prototype = Object.create(Task.prototype);
Harvest.prototype.constructor = Harvest;

Harvest.prototype.canAssign = function(creep, tasks) {
    if (creep.memory.role !== "worker" || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Harvest.prototype.run = function(creep) {
    // Find the closest source, accounting for sources that are out of energy.
    var sources = _.sortBy(Cache.energySourcesInRoom(room), (s) => s.pos.getRangeTo(creep) * 3 + (s.energy === 0 ? s.ticksToRegeneration : 0));
    
    // No sources found, complete task.
    if (sources.length === 0) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Harvest the source, or move closer to it if not in range.
    if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0], {reusePath: Math.floor(Math.random() * 2)});
    }
};

Harvest.prototype.canComplete = function(creep) {
    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Harvest.prototype.toObj = function(creep) {
    creep.memory.currentTask = {
        type: this.type
    }
};

Harvest.fromObj = function(creep) {
    return new Harvest();
};

module.exports = Harvest;
