var Task = require("task"),
    Heal = function(id) {
        Task.call(this);
        
        this.type = "heal";
        this.ally = Game.getObjectById(id);
    };
    
Heal.prototype = Object.create(Task.prototype);
Heal.prototype.constructor = Heal;

Heal.prototype.canAssign = function(creep, tasks) {
    if (creep.memory.role !== "healer") {
        return false;
    }
    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Heal.prototype.run = function(creep) {
    // If ally is gone or at full health, we're done.
    if (!this.ally || this.ally.hits === this.ally.hitsMax) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    if (creep.heal(this.ally) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.ally, {reusePath: Math.floor(Math.random() * 2)});
    }
};

Heal.prototype.canComplete = function(creep) {
    if (!this.ally || this.ally.hits === this.ally.hitsMax) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Heal.fromObj = function(creep) {
    return new Heal(creep.memory.currentTask.id);
};

Heal.prototype.toObj = function(creep) {
    if (this.ally) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.ally.id
        }
    } else {
        delete creep.memory.currentTask;
    }
};

module.exports = Heal;
