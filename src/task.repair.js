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

Repair.prototype.canAssign = function(creep) {
    "use strict";

    if (!creep.carry[RESOURCE_ENERGY] || (_.sum(creep.carry) != creep.carryCapacity && creep.ticksToLive >= 150) || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Repair.prototype.run = function(creep) {
    "use strict";

    // Check for destroyed structure.
    if (!this.structure) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Repair the structure, or move closer to it if not in range.
    if (creep.repair(this.structure) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.structure, {reusePath: Math.floor(Math.random() * 2) + 1});
    }
};

Repair.prototype.canComplete = function(creep) {
    "use strict";

    if (!creep.carry[RESOURCE_ENERGY] || !this.structure || this.structure.hits === this.structure.hitsMax) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Repair.prototype.toObj = function(creep) {
    "use strict";

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
    "use strict";

    return new Repair(creep.memory.currentTask.id);
};

Repair.getCriticalTasks = function(room) {
    "use strict";

    return _.sortBy(_.map(_.filter(Cache.repairableStructuresInRoom(room), (s) => s.hits < 100000 && s.hits / s.hitsMax < 0.5), (s) => new Repair(s.id)), (s) => s.structure.hits);
};

Repair.getTasks = function(room) {
    "use strict";

    return _.sortBy(_.map(_.filter(Cache.repairableStructuresInRoom(room), (s) => (room.controller.level === 8 || s.hits < 1000000) && s.hits / s.hitsMax < 0.9), (s) => new Repair(s.id)), (s) => s.structure.hits);
};

Repair.getDeliveryTasks = function(room) {
    "use strict";

    return _.sortBy(_.map(_.filter(Cache.repairableStructuresInRoom(room), (s) => s.hits < 2500 && s.hits), (s) => new Repair(s.id)), (s) => s.structure.hits);
};

require("screeps-profiler").registerObject(Repair, "TaskRepair");
module.exports = Repair;
