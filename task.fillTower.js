var Task = require("task"),
    Tower = function(id) {
        Task.call(this);

        this.type = "fillTower";
        this.tower = Game.getObjectById(id);
    };
    
Tower.prototype = Object.create(Task.prototype);
Tower.prototype.constructor = Tower;

Tower.prototype.canAssign = function(creep, tasks) {
    if (creep.memory.role !== "worker" || creep.carry.energy === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Tower.prototype.run = function(creep) {
    // Fill the tower, or move closer to it if not in range.
    if (creep.transfer(this.tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.tower, {reusePath: Math.floor(Math.random() * 2)});
        return;
    }

    // Task always is completed one way or another upon successful transfer.
    Task.prototype.complete.call(this, creep);
};

Tower.prototype.canComplete = function(creep) {
    if (creep.carry.energy === 0 || this.tower.energy === this.tower.energyCapacity) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Tower.fromObj = function(creep) {
    return new Tower(creep.memory.currentTask.id);
};

Tower.prototype.toObj = function(creep) {
    creep.memory.currentTask = {
        type: this.type,
        id: this.tower.id
    }
};

module.exports = Tower;
