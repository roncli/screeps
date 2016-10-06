var Task = require("task"),
    Upgrade = function() {
        Task.call(this);

        this.type = "upgradeController";
    };
    
Upgrade.prototype = Object.create(Task.prototype);
Upgrade.prototype.constructor = Upgrade;

Upgrade.prototype.canAssign = function(creep, tasks) {
    if (creep.memory.role !== "worker" || creep.carry.energy === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Upgrade.prototype.run = function(creep) {
    // Find the controller.
    var controller = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTROLLER
    });

    // No controllers found, complete task.
    if (!controller) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Upgrade the controller, or move closer to it if not in range.
    if (creep.transfer(controller, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(controller, {reusePath: Math.floor(Math.random() * 2)});
    }
};

Upgrade.prototype.canComplete = function(creep) {
    if (creep.carry.energy === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Upgrade.fromObj = function(creep) {
    return new Upgrade();
};

Upgrade.prototype.toObj = function(creep) {
    creep.memory.currentTask = {
        type: this.type
    }
};

module.exports = Upgrade;
