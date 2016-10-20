var Task = require("task"),
    Cache = require("cache"),
    FillMinerals = function(id) {
        Task.call(this);

        this.type = "fillMinerals";
        this.id = id;
        this.object = Cache.getObjectById(id);
    };
    
FillMinerals.prototype = Object.create(Task.prototype);
FillMinerals.prototype.constructor = FillMinerals;

FillMinerals.prototype.canAssign = function(creep) {
    "use strict";

    if (_.sum(creep.carry) === 0 || creep.carry[RESOURCE_ENERGY] === _.sum(creep.carry)) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

FillMinerals.prototype.run = function(creep) {
    "use strict";

    var minerals;

    // Object not found, complete task.
    if (!this.object) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Get the resource we're going to use.
    minerals = _.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0);

    // We're out of minerals, complete task.
    if (minerals.length === 0) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Fill the object, or move closer to it if not in range.
    if (creep.transfer(this.object, minerals[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.object, {reusePath: Math.floor(Math.random() * 2) + 4});
        return;
    }

    // If we are out of minerals, complete task.
    if (_.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0) {
        Task.prototype.complete.call(this, creep);
    }
};

FillMinerals.prototype.canComplete = function(creep) {
    "use strict";

    if (!this.object) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

    var energy = _.sum(this.object.store) || 0;

    if (_.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0 || energy === this.object.storeCapacity) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

FillMinerals.prototype.toObj = function(creep) {
    "use strict";

    if (this.object) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        }
    } else {
        delete creep.memory.currentTask;
    }
};

FillMinerals.fromObj = function(creep) {
    "use strict";

    return new FillMinerals(creep.memory.currentTask.id);
};

FillMinerals.getFillStorageTasks = function(room) {
    "use strict";

    if (room.terminal && _.sum(room.terminal.store) < room.terminal.storeCapacity) {
        return [new FillMinerals(room.terminal.id)];
    }

    if (room.storage && _.sum(room.storage.store) < room.storage.storeCapacity) {
        return [new FillMinerals(room.storage.id)];
    }

    return [];
};

require("screeps-profiler").registerObject(FillMinerals, "TaskFillMinerals");
module.exports = FillMinerals;
