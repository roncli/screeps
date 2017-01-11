var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities"),
    CollectMinerals = function(id, resource, amount) {
        "use strict";
        
        this.init(id, resource, amount);
    };
    
CollectMinerals.prototype = Object.create(Task.prototype);
CollectMinerals.prototype.constructor = CollectMinerals;

CollectMinerals.prototype.init = function(id, resource, amount) {
    "use strict";
    
    Task.call(this);

    this.type = "collectMinerals";
    this.id = id;
    this.resource = resource;
    this.amount = amount;
    this.object = Game.getObjectById(id);
};

CollectMinerals.prototype.canAssign = function(creep) {
    "use strict";

    var obj = this.object;

    if (this.amount < 0 || creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || creep.carry[RESOURCE_ENERGY] > 0) {
        return false;
    }
    
    if (this.resource && this.amount) {
        if (obj instanceof StructureLab && obj.mineralType !== this.resource && obj.mineralAmount < this.amount) {
            return false;
        }

        if (!(obj instanceof StructureLab) && (obj.store[this.resource] || 0) < this.amount) {
            return false;
        }
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

CollectMinerals.prototype.run = function(creep) {
    "use strict";

    var obj = this.object,
        objStore = obj.store,
        resource = this.resource,
        creepCarry = creep.carry,
        creepCarryCapacity = creep.carryCapacity,
        amount = this.amount,
        minerals;

    // Object not found, complete task.
    if (!obj) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Get the resource we're going to use.
    if (obj instanceof StructureLab) {
        minerals = [obj.mineralType];
    } else if (resource) {
        minerals = [resource];
    } else {
        minerals = _.filter(_.keys(objStore), (m) => m !== RESOURCE_ENERGY && objStore[m] > 0);
    }

    // We're out of minerals, complete task.
    if (minerals.length === 0) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Move to the object.
    Pathing.moveTo(creep, obj, 1);

    // Collect from the object.
    if (amount) {
        if (creep.withdraw(obj, minerals[0], Math.min(amount, creepCarryCapacity - _.sum(creepCarry))) === OK) {
            Task.prototype.complete.call(this, creep);
        }
        return;
    }

    if (creep.withdraw(obj, minerals[0]) === OK) {
        // If we're full or there are no more minerals, complete task.
        if (resource || _.sum(creepCarry) === creepCarryCapacity || (objStore && _.filter(_.keys(objStore), (m) => m !== RESOURCE_ENERGY && objStore[m] > 0).length === 0) || (obj instanceof StructureLab && obj.mineralAmount === 0)) {
            Task.prototype.complete.call(this, creep);
        }
    }
};

CollectMinerals.prototype.canComplete = function(creep) {
    "use strict";

    // If the creep is about to die or if the object doesn't exist, complete.
    if (this.amount < 0 || creep.ticksToLive < 150 || !this.object) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

    // If we're full or there are no more minerals, complete task.
    if (_.sum(creep.carry) === creep.carryCapacity || (this.object.store && _.filter(_.keys(this.object.store), (m) => m !== RESOURCE_ENERGY && this.object.store[m] > 0).length === 0) || (this.object instanceof StructureLab && this.object.mineralAmount === 0)) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

CollectMinerals.prototype.toObj = function(creep) {
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

CollectMinerals.fromObj = function(creep) {
    "use strict";

    return new CollectMinerals(creep.memory.currentTask.id, creep.memory.currentTask.resource, creep.memory.currentTask.amount);
};

CollectMinerals.getStorerTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.containersInRoom(room), (c) => _.filter(_.keys(c.store), (m) => m !== RESOURCE_ENERGY && c.store[m] >= 500).length > 0).sort((a, b) => _.sum(b.store) - _.sum(a.store)), (c) => new CollectMinerals(c.id));
};

CollectMinerals.getCleanupTasks = function(structures) {
    "use strict";

    return _.map(_.filter(structures, (s) => (s.store || s instanceof StructureLab) && ((_.sum(s.store) > 0 && s.store[RESOURCE_ENERGY] < _.sum(s.store)) || s.mineralAmount > 0)).sort((a, b) => (a instanceof StructureLab ? a.mineralAmount : _.sum(a.store) - a.store[RESOURCE_ENERGY]) - (b instanceof StructureLab ? b.mineralAmount : _.sum(b.store) - b.store[RESOURCE_ENERGY])), (s) => new CollectMinerals(s.id));
};

CollectMinerals.getLabTasks = function(room) {
    "use strict";

    var roomMemory = room.memory,
        labsInUse = roomMemory.labsInUse,
        labQueue = roomMemory.labQueue,
        roomStorage = room.storage,
        labs = Cache.labsInRoom(room),
        tasks = [],
        status, sourceLabs;

    if (labQueue) {
        status = labQueue.status,
        sourceLabs = labQueue.sourceLabs;
    }

    if (labsInUse) {
        _.forEach(labsInUse, (lab) => {
            if (!Game.creeps[lab.creepToBoost]) {
                tasks.push(new CollectMinerals(lab.id));
            }
        });

        _.forEach(tasks, (task) => {
            _.remove(labsInUse, (l) => l.id === task.id);
        });
    }

    if (roomStorage && labQueue && status === "clearing") {
        _.forEach(_.filter(labs, (l) => _.map(labsInUse, (liu) => liu.id).indexOf(l.id) === -1 && l.mineralAmount > 0), (lab) => {
            tasks.push(new CollectMinerals(lab.id));
        });
    }

    if (roomStorage && labsInUse) {
        _.forEach(_.filter(labsInUse, (l) => (!l.status || l.status === "emptying") && Game.getObjectById(l.id).mineralType && Game.getObjectById(l.id).mineralType !== l.resource), (lab) => {
            tasks.push(new CollectMinerals(lab.id));
        });
    }

    if (roomStorage && labQueue && status === "creating" && !Utilities.roomLabsArePaused(room)) {
        if (Game.getObjectById(sourceLabs[0]).mineralAmount === 0 && Game.getObjectById(sourceLabs[1]).mineralAmount !== 0) {
            tasks.push(new CollectMinerals(sourceLabs[1]));
        }
        if (Game.getObjectById(sourceLabs[0]).mineralAmount !== 0 && Game.getObjectById(sourceLabs[1]).mineralAmount === 0) {
            tasks.push(new CollectMinerals(sourceLabs[0]));
        }
    }

    if (roomStorage && labQueue && status === "returning") {
        _.forEach(_.filter(labs, (l) => l.mineralType === labQueue.resource), (lab) => {
            tasks.push(new CollectMinerals(lab.id));
        });
    }

    return tasks;
};

CollectMinerals.getStorageTasks = function(room) {
    "use strict";

    var tasks = [],
        amount;

    if (room.storage && room.memory.labsInUse) {
        _.forEach(_.filter(room.memory.labsInUse, (l) => (!l.status || ["filling", "refilling"].indexOf(l.status) !== -1) && (!Game.getObjectById(l.id).mineralType || Game.getObjectById(l.id).mineralType === (l.status === "refilling" ? l.oldResource : l.resource))), (l) => {
            if ((l.status === "refilling" ? (l.oldAmount - Game.getObjectById(l.id).mineralAmount) : (l.amount - Game.getObjectById(l.id).mineralAmount)) > 0) {
                tasks.push(new CollectMinerals(room.storage.id, l.status === "refilling" ? l.oldResource : l.resource, l.status === "refilling" ? (l.oldAmount - Game.getObjectById(l.id).mineralAmount) : (l.amount - Game.getObjectById(l.id).mineralAmount)));
            }
        });
    }

    // We only need to transfer from storage to lab when we have both storage and at least 3 labs.
    if (room.storage && room.memory.labQueue && room.memory.labQueue.status === "moving" && Cache.labsInRoom(room).length >= 3 && !Utilities.roomLabsArePaused(room)) {
        _.forEach(room.memory.labQueue.children, (resource) => {
            if ((amount = _.sum(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === resource), (l) => l.mineralAmount)) < room.memory.labQueue.amount) {
                tasks.push(new CollectMinerals(room.storage.id, resource, room.memory.labQueue.amount - amount));
            }
        });
    }

    // We only need to transfer from storage to terminal when we have both storage and terminal.
    if (room.storage && room.terminal && Memory.reserveMinerals) {
        _.forEach(room.storage.store, (amount, resource) => {
            if (resource === RESOURCE_ENERGY) {
                return;
            }
            if (!Memory.reserveMinerals[resource]) {
                tasks.push(new CollectMinerals(room.storage.id, resource, amount));
            } else if ((resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource]) < amount) {
                tasks.push(new CollectMinerals(room.storage.id, resource, amount - (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource])));
            }
        });
    }

    // If we have a nuker, transfer ghodium.
    _.forEach(Cache.nukersInRoom(room), (nuker) => {
        if (nuker.ghodium < nuker.ghodiumCapacity) {
            tasks.push(new CollectMinerals(room.storage.id, RESOURCE_GHODIUM, nuker.ghodiumCapacity - nuker.ghodium));
        }
    });

    // If we have a power spawn, transfer power.
    _.forEach(Cache.powerSpawnsInRoom(room), (spawn) => {
        if (spawn.power < spawn.powerCapacity) {
            tasks.push(new CollectMinerals(room.storage.id, RESOURCE_POWER, spawn.powerCapacity - spawn.power));
        }
    });

    return tasks;
};

CollectMinerals.getTerminalTasks = function(room) {
    "use strict";

    var tasks = [];

    // We only need to transfer from terminal when we have both storage and terminal.
    if (room.storage && room.terminal && Memory.reserveMinerals) {
        _.forEach(room.terminal.store, (amount, resource) => {
            if (resource === RESOURCE_ENERGY) {
                return;
            }
            if (!Memory.reserveMinerals[resource]) {
                return;
            }
            if (!room.storage.store[resource]) {
                tasks.push(new CollectMinerals(room.terminal.id, resource, Math.min(amount, (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource]))));
            } else if (room.storage.store[resource] < Memory.reserveMinerals[resource]) {
                tasks.push(new CollectMinerals(room.terminal.id, resource, Math.min(amount, (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource]) - room.storage.store[resource])));
            }
        });
    }

    return tasks;
};

require("screeps-profiler").registerObject(CollectMinerals, "TaskCollectMinerals");
module.exports = CollectMinerals;
