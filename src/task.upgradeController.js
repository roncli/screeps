var Task = require("task"),
    Pathing = require("pathing"),
    Upgrade = function(room) {
        Task.call(this);

        this.type = "upgradeController";
        this.room = room;
        this.controller = Game.rooms[room].controller;
};
    
Upgrade.prototype = Object.create(Task.prototype);
Upgrade.prototype.constructor = Upgrade;

Upgrade.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || (_.sum(creep.carry) != creep.carryCapacity && creep.ticksToLive >= 150 && this.controller.ticksToDowngrade >= 1000) || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Upgrade.prototype.run = function(creep) {
    "use strict";

    // Controller not found, complete task.
    if (!this.controller) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Move to the controller and upgrade it.
    Pathing.moveTo(creep, this.controller, 3);
    creep.transfer(this.controller, RESOURCE_ENERGY);
};

Upgrade.prototype.canComplete = function(creep) {
    "use strict";

    if (!creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Upgrade.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type,
        room: this.room
    }
};

Upgrade.fromObj = function(creep) {
    "use strict";

    return new Upgrade(creep.memory.currentTask.room);
};

Upgrade.getCriticalTasks = function(room) {
    "use strict";

    if (room.controller && room.controller.my && room.controller.ticksToDowngrade < 1000) {
        return [new Upgrade(room.name)];
    }

    return [];
};

Upgrade.getTasks = function(room) {
    "use strict";

    if (room.controller && room.controller.my) {
        return [new Upgrade(room.name)];
    }
};

require("screeps-profiler").registerObject(Upgrade, "TaskUpgradeController");
module.exports = Upgrade;
