var Task = require("task"),
    Spawn = function(id) {
        Task.call(this);

        this.type = "fillSpawn";
        this.spawn = Game.getObjectById(id);
    };
    
Spawn.prototype = Object.create(Task.prototype);
Spawn.prototype.constructor = Spawn;

Spawn.prototype.canAssign = function(creep, tasks) {
    if (creep.memory.role !== "worker" || creep.carry.energy === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Spawn.prototype.run = function(creep) {
    // Fill the spawn, or move closer to it if not in range.
    switch (creep.transfer(this.spawn, RESOURCE_ENERGY)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(this.spawn, {reusePath: Math.floor(Math.random() * 2)});
            break;
        case OK:
            // Task always is completed one way or another upon successful transfer.
            Task.prototype.complete.call(this, creep);
            break;
    }
};

Spawn.prototype.canComplete = function(creep) {
    if (creep.carry.energy === 0 || this.spawn.energy === this.spawn.energyCapacity) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Spawn.fromObj = function(creep) {
    return new Spawn(creep.memory.currentTask.id);
};

Spawn.prototype.toObj = function(creep) {
    creep.memory.currentTask = {
        type: this.type,
        id: this.spawn.id
    }
};

module.exports = Spawn;
