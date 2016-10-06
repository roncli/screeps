var Task = require("task"),
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
    var sources = creep.room.find(FIND_SOURCES),
        source;
    
    sources.sort((a, b) => {
        return (a.pos.getRangeTo(creep) * 3 + (a.energy === 0 ? a.ticksToRegeneration : 0)) - (b.pos.getRangeTo(creep) * 3 + (b.energy === 0 ? b.ticksToRegeneration : 0));
    });
    
    // No sources found, complete task.
    if (sources.length === 0) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Harvest the source, or move closer to it if not in range.
    source = sources[0];
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {reusePath: Math.floor(Math.random() * 2)});
    }
};

Harvest.prototype.canComplete = function(creep) {
    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Harvest.fromObj = function(creep) {
    return new Harvest();
};

Harvest.prototype.toObj = function(creep) {
    creep.memory.currentTask = {
        type: this.type
    }
};

module.exports = Harvest;
