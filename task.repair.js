var Task = require("task"),
    Repair = function(id) {
        Task.call(this);

        this.type = "repair";
        this.structure = Game.getObjectById(id);
    };
    
Repair.prototype = Object.create(Task.prototype);
Repair.prototype.constructor = Repair;

Repair.prototype.canAssign = function(creep, tasks) {
    if (creep.memory.role !== "worker" || creep.carry.energy === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Repair.prototype.run = function(creep) {
    // Check for destroyed structure.
    if (!this.structure) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Repair the structure, or move closer to it if not in range.
    if (creep.repair(this.structure) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.structure, {reusePath: Math.floor(Math.random() * 2)});
    }
};

Repair.prototype.canComplete = function(creep) {
    if (creep.carry.energy === 0 || !this.structure || this.structure.hits === this.structure.hitsMax) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Repair.fromObj = function(creep) {
    return new Repair(creep.memory.currentTask.id);
};

Repair.prototype.toObj = function(creep) {
    if (this.structure) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.structure.id
        }
    } else {
        delete creep.memory.currentTask;
    }
};

module.exports = Repair;
