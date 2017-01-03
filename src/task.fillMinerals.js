var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities"),
    FillMinerals = function(id, resource, amount) {
        "use strict";
        
        this.init(id, resource, amount);
    };
    
FillMinerals.prototype = Object.create(Task.prototype);
FillMinerals.prototype.constructor = FillMinerals;

FillMinerals.prototype.init = function(id, resource, amount) {
    "use strict";

    Task.call(this);

    this.type = "fillMinerals";
    this.id = id;
    this.resource = resource;
    this.amount = amount;
    this.object = Game.getObjectById(id);
};

FillMinerals.prototype.canAssign = function(creep) {
    "use strict";

    if (this.amount < 0 || creep.spawning || _.sum(creep.carry) === 0 || creep.carry[RESOURCE_ENERGY] === _.sum(creep.carry)) {
        return false;
    }

    if (this.resource && (!creep.carry[this.resource] || creep.carry[this.resource] === 0)) {
        return false;
    }

    if (this.object instanceof StructureNuker && this.object.ghodium === this.object.ghodiumCapacity) {
        return false;
    }

    if (this.object instanceof StructurePowerSpawn && this.object.power === this.object.powerCapacity) {
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
        if (creep.transfer(this.object, minerals[0]) === OK) {
            // If we are out of minerals, complete task.
            if (_.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0) {
                Task.prototype.complete.call(this, creep);
            }
        }
    } else if (!this.amount) {
        // Move to the object and fill it.
        Pathing.moveTo(creep, this.object, 1);
        if (creep.transfer(this.object, this.resource) === OK) {
            Task.prototype.complete.call(this, creep);
        }
    } else {
        // Move to the object and fill it.
        Pathing.moveTo(creep, this.object, 1);
        if (creep.transfer(this.object, this.resource, Math.min(this.amount, creep.carry[this.resource])) === OK) {
            Task.prototype.complete.call(this, creep);
        }
    }
};

FillMinerals.prototype.canComplete = function(creep) {
    "use strict";

    if (this.amount < 0 || !this.object) {
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
    
    var tasks = [];

    _.forEach(_.filter(room.memory.labsInUse, (l) => (!l.status || ["filling", "refilling"].indexOf(l.status) !== -1) && (!Game.getObjectById(l.id).mineralType || Game.getObjectById(l.id).mineralType === (l.status === "refilling" ? l.oldResource : l.resource)) && (Game.getObjectById(l.id).mineralAmount < (l.status === "refilling" ? l.oldAmount : l.amount))), (lab) => {
        tasks.push(new FillMinerals(lab.id, lab.status === "refilling" ? lab.oldResource : lab.resource, (lab.status === "refilling" ? lab.oldAmount : lab.amount) - Game.getObjectById(lab.id).mineralAmount));
    });

    if (room.storage && Cache.labsInRoom(room).length >= 3 && room.memory.labQueue && room.memory.labQueue.status === "moving" && !Utilities.roomLabsArePaused(room)) {
        if (Game.getObjectById(room.memory.labQueue.sourceLabs[0]).mineralAmount < room.memory.labQueue.amount) {
            tasks.push(new FillMinerals(room.memory.labQueue.sourceLabs[0], room.memory.labQueue.children[0], room.memory.labQueue.amount - Game.getObjectById(room.memory.labQueue.sourceLabs[0]).mineralAmount));
        }
        if (Game.getObjectById(room.memory.labQueue.sourceLabs[1]).mineralAmount < room.memory.labQueue.amount) {
            tasks.push(new FillMinerals(room.memory.labQueue.sourceLabs[1], room.memory.labQueue.children[1], room.memory.labQueue.amount - Game.getObjectById(room.memory.labQueue.sourceLabs[1]).mineralAmount));
        }
    }

    return tasks;
};

FillMinerals.getStorageTasks = function(room) {
    "use strict";

    var storage = room.storage,
        store;

    // If the room only has storage and no terminal, minerals go to storage.
    if (storage && !room.terminal) {
        return [new FillMinerals(storage.id)];
    }

    // If the room has storage and is not at capacity, minerals should be put into storage, but only up to a certain amount.
    if (storage && _.sum(store = storage.store) < storage.storeCapacity && Memory.reserveMinerals) {
        return _.filter(_.map(_.keys(Memory.reserveMinerals), (r) => new FillMinerals(storage.id, r, Memory.reserveMinerals[r] - (store[r] || 0))), (f) => f.amount > 0);
    }
};

FillMinerals.getTerminalTasks = function(room) {
    "use strict";

    if (room.terminal && _.sum(room.terminal.store) < room.terminal.storeCapacity) {
        return [new FillMinerals(room.terminal.id)];
    }
    return [];
};

FillMinerals.getNukerTasks = function(room) {
    "use strict";

    var nukers = Cache.nukersInRoom(room);

    if (nukers.length === 0) {
        return [];
    }

    return [new FillMinerals(nukers[0].id, RESOURCE_GHODIUM)];
};

FillMinerals.getPowerSpawnTasks = function(room) {
    "use strict";

    var spawns = Cache.powerSpawnsInRoom(room);

    if (spawns.length === 0) {
        return [];
    }

    return [new FillMinerals(spawns[0].id, RESOURCE_POWER)];
};

require("screeps-profiler").registerObject(FillMinerals, "TaskFillMinerals");
module.exports = FillMinerals;
