var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    FillMinerals = function(id, resource, amount) {
        Task.call(this);

        this.type = "fillMinerals";
        this.id = id;
        this.resource = resource;
        this.amount = amount;
        this.object = Cache.getObjectById(id);
    };
    
FillMinerals.prototype = Object.create(Task.prototype);
FillMinerals.prototype.constructor = FillMinerals;

FillMinerals.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || _.sum(creep.carry) === 0 || creep.carry[RESOURCE_ENERGY] === _.sum(creep.carry)) {
        return false;
    }

    if (this.resource && (!creep.carry[this.resource] || creep.carry[this.resource] === 0)) {
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

    if (!this.resource) {
        // Get the resource we're going to use.
        minerals = _.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0);

        // We're out of minerals, complete task.
        if (minerals.length === 0) {
            Task.prototype.complete.call(this, creep);
            return;
        }

        // Move to the object and fill it.
        Pathing.moveTo(creep, this.object, 1);
        creep.transfer(this.object, minerals[0]);

        // If we are out of minerals, complete task.
        if (_.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0) {
            Task.prototype.complete.call(this, creep);
        }
    } else if (!this.amount) {
        // Move to the object and fill it.
        Pathing.moveTo(creep, this.object, 1);
        creep.transfer(this.object, this.resource);

        // Complete task.
        Task.prototype.complete.call(this, creep);
    } else {
        // Move to the object and fill it.
        Pathing.moveTo(creep, this.object, 1);
        creep.transfer(this.object, this.resource, Math.min(this.amount, creep.carry[this.resource]));

        // Complete task.
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
            id: this.id,
            resource: this.resource,
            amount: this.amount
        }
    } else {
        delete creep.memory.currentTask;
    }
};

FillMinerals.fromObj = function(creep) {
    "use strict";

    return new FillMinerals(creep.memory.currentTask.id, creep.memory.currentTask.resource, creep.memory.currentTask.amount);
};

FillMinerals.getLabTasks = function(room) {
    "use strict";

    return [];
};

FillMinerals.getStorageTasks = function(room) {
    "use strict";

    var tasks = [];

    // If the room only has storage and no terminal, minerals go to storage.
    if (room.storage && !room.terminal) {
        return [new FillMinerals(room.storage.id)];
    }

    // If the room has storage and is not at capacity, minerals should be put into storage, but only up to a certain amount.
    if (room.storage && _.sum(room.storage.store) < room.storage.storeCapacity && room.memory.reserveMinerals) {
        _.forEach(room.memory.reserveMinerals, (amount, resource) => {
            if (!room.storage.store[resource]) {
                tasks.push(new FillMinerals(room.storage.id, resource, amount));
            } else if (room.storage.store[resource] < amount) {
                tasks.push(new FillMinerals(room.storage.id, resource, amount - room.storage.store[resource]));
            }
        });
    }

    return tasks;
};

FillMinerals.getTerminalTasks = function(room) {
    "use strict";

    if (room.terminal && _.sum(room.terminal.store) < room.terminal.storeCapacity) {
        return [new FillMinerals(room.terminal.id)];
    }
    return [];
};

require("screeps-profiler").registerObject(FillMinerals, "TaskFillMinerals");
module.exports = FillMinerals;
