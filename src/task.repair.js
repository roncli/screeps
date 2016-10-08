var Task = require("task"),
    Cache = require("cache"),
    Repair = function(id) {
        Task.call(this);

        this.type = "repair";
        this.id = id;
        this.structure = Cache.getObjectById(id);
    };
    
Repair.prototype = Object.create(Task.prototype);
Repair.prototype.constructor = Repair;

Repair.prototype.canAssign = function(creep, tasks) {
    if (!creep.carry[RESOURCE_ENERGY]) {
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
    if (!creep.carry[RESOURCE_ENERGY] || !this.structure || this.structure.hits === this.structure.hitsMax) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
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

Repair.fromObj = function(creep) {
    return new Repair(creep.memory.currentTask.id);
};

Repair.getCriticalTasks = function(room) {
    return _.sortBy(_.map(_.filter(Cache.repairableStructuresInRoom(room), (s) => s.hits < 100000 && s.hits / s.hitsMax < 0.5), (s) => new Repair(s.id)), (s) => s.structure.hits);
};

Repair.getTasks = function(room) {
    return _.sortBy(_.map(_.filter(Cache.repairableStructuresInRoom(room), (s) => s.hits / s.hitsMax < 0.9), (s) => new Repair(s.id)), (s) => s.structure.hits);
};

require("screeps-profiler").registerObject(Repair, "TaskRepair");
module.exports = Repair;
