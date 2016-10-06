var Task = require("task"),
    Rally = function(id) {
        Task.call(this);

        this.type = "rally";
        this.id = id;
        this.rallyPoint = Game.getObjectById(id);
        if (!this.rallyPoint) {
            this.rallyPoint = Game.flags[id];
        }
    };
    
Rally.prototype = Object.create(Task.prototype);
Rally.prototype.constructor = Rally;

Rally.prototype.canAssign = function(creep, tasks) {
    if (["rangedAttack", "healer"].indexOf(creep.memory.role) === -1) {
        return false;
    }

    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Rally.prototype.run = function(creep) {
    var pos = this.rallyPoint.pos;
    
    if (!this.rallyPoint) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    // Rally to the rally point.
    creep.moveTo(pos.x + Math.floor(Math.random() * 7 - 3), pos.y + Math.floor(Math.random() * 7 - 3), {reusePath: Math.floor(Math.random() * 2)});
};

Rally.prototype.canComplete = function(creep) {
    if (!this.rallyPoint) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Rally.fromObj = function(creep) {
    return new Rally(creep.memory.currentTask.id);
};

Rally.prototype.toObj = function(creep) {
    if (this.rallyPoint) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        }
    } else {
        delete creep.memory.currentTask;
    }
};

module.exports = Rally;
