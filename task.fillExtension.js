var Task = require("task"),
    Extension = function(id) {
        Task.call(this);

        this.type = "fillExtension";
        this.extension = Game.getObjectById(id);
    };
    
Extension.prototype = Object.create(Task.prototype);
Extension.prototype.constructor = Extension;

Extension.prototype.canAssign = function(creep, tasks) {
    if (creep.memory.role !== "worker" || creep.carry.energy === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Extension.prototype.run = function(creep) {
    // Fill the extension, or move closer to it if not in range.
    switch (creep.transfer(this.extension, RESOURCE_ENERGY)) {
        case ERR_NOT_IN_RANGE:
            creep.moveTo(this.extension, {reusePath: Math.floor(Math.random() * 2)});
            break;
        case OK:
            // Task always is completed one way or another upon successful transfer.
            Task.prototype.complete.call(this, creep);
            break;
    }
};

Extension.prototype.canComplete = function(creep) {
    if (creep.carry.energy === 0 || this.extension.energy === this.extension.energyCapacity) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Extension.fromObj = function(creep) {
    return new Extension(creep.memory.currentTask.id);
};

Extension.prototype.toObj = function(creep) {
    creep.memory.currentTask = {
        type: this.type,
        id: this.extension.id
    }
};

module.exports = Extension;
