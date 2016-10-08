var Task = require("task"),
    Cache = require("cache"),
    CollectEnergy = function(id) {
        Task.call(this);

        this.type = "collectEnergy";
        this.id = id;
        this.object = Cache.getObjectById(id);
    };
    
CollectEnergy.prototype = Object.create(Task.prototype);
CollectEnergy.prototype.constructor = CollectEnergy;

CollectEnergy.prototype.canAssign = function(creep) {
    if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

CollectEnergy.prototype.run = function(creep) {
    // Object not found, complete task.
    if (!this.object) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Collect from the object, or move closer to it if not in range.
    if (creep.withdraw(this.object, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.object, {reusePath: Math.floor(Math.random() * 2)});
        return;
    }

    // If we didn't move, complete task.
    Task.prototype.complete.call(this, creep);
};

CollectEnergy.prototype.canComplete = function(creep) {
    // If the creep is about to die or if the object doesn't exist, complete.
    if (creep.ticksToLive < 150 || !this.object) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

    // Check the object's energy.
    var energy = this.object.energy;
    if (energy === undefined) {
        energy = this.object.store[RESOURCE_ENERGY] || 0;
    }

    // If the creep is full on capacity or the energy is empty, complete.
    if (_.sum(creep.carry) === creep.carryCapacity || energy === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

CollectEnergy.prototype.toObj = function(creep) {
    if (this.object) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        }
    } else {
        delete creep.memory.currentTask;
    }
};

CollectEnergy.fromObj = function(creep) {
    return new CollectEnergy(creep.memory.currentTask.id);
};

CollectEnergy.getTasks = function(room) {
    return _.map(_.sortBy(_.filter([].concat.apply([], [Cache.containersInRoom(room), room.storage ? [room.storage] : []]), (c) => c.store[RESOURCE_ENERGY] && c.store[RESOURCE_ENERGY] > 0), (c) => -c.store[RESOURCE_ENERGY]), (c) => new CollectEnergy(c.id));
};

require("screeps-profiler").registerObject(CollectEnergy, "TaskCollectEnergy");
module.exports = CollectEnergy;
