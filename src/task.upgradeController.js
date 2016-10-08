var Task = require("task"),
    Upgrade = function(room) {
        Task.call(this);

        this.type = "upgradeController";
        this.room = room;
        this.controller = Game.rooms[room].controller;
};
    
Upgrade.prototype = Object.create(Task.prototype);
Upgrade.prototype.constructor = Upgrade;

Upgrade.prototype.canAssign = function(creep) {
    if (!creep.carry[RESOURCE_ENERGY] || (_.sum(creep.carry) != creep.carryCapacity && creep.ticksToLive >= 150 && this.controller.ticksToDowngrade >= 1000)) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Upgrade.prototype.run = function(creep) {
    // Controller not found, complete task.
    if (!this.controller) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Upgrade the controller, or move closer to it if not in range.
    if (creep.transfer(this.controller, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.controller, {reusePath: Math.floor(Math.random() * 2)});
    }
};

Upgrade.prototype.canComplete = function(creep) {
    if (!creep.carry[RESOURCE_ENERGY]) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Upgrade.prototype.toObj = function(creep) {
    creep.memory.currentTask = {
        type: this.type,
        room: this.room
    }
};

Upgrade.fromObj = function(creep) {
    return new Upgrade(creep.memory.currentTask.room);
};

Upgrade.getCriticalTasks = function(room) {
    if (room.controller && room.controller.my && room.controller.ticksToDowngrade < 1000) {
        return [new Upgrade(room.name)];
    }

    return [];
};

Upgrade.getTasks = function(room) {
    if (room.controller && room.controller.my) {
        return [new Upgrade(room.name)];
    }
};

require("screeps-profiler").registerObject(Upgrade, "TaskUpgradeController");
module.exports = Upgrade;
