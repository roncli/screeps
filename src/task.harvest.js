var Task = require("task"),
    Cache = require("cache"),
    Harvest = function() {
        Task.call(this);
        
        this.type = "harvest";
    };
    
Harvest.prototype = Object.create(Task.prototype);
Harvest.prototype.constructor = Harvest;

Harvest.prototype.canAssign = function(creep) {
    var source = Cache.getObjectById(creep.memory.home);

    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || (!source && creep.memory.role !== "delivery") || (source && source.energy === 0)) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Harvest.prototype.run = function(creep) {
    var source = Cache.getObjectById(creep.memory.home),
        pos;
    
    // No sources found or the source is drained, complete task.
    if ((!source && creep.memory.role !== "delivery") || (source && source.energy === 0)) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Harvest the source, or move closer to it if not in range.
    if (source) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {reusePath: Math.floor(Math.random() * 2)});
        }
    } else {
        pos = Memory.maxCreeps[creep.memory.deliver][creep.memory.home].fromPos;
        creep.moveTo(new RoomPosition(pos.x, pos.y, pos.roomName));
    }
};

Harvest.prototype.canComplete = function(creep) {
    var source = Cache.getObjectById(creep.memory.home);

    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || (!source && creep.memory.role !== "delivery") || (source && source.energy === 0)) {
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

require("screeps-profiler").registerObject(Harvest, "TaskHarvest");
module.exports = Harvest;
