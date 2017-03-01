var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    CollectEnergy = function(id) {
        "use strict";
        
        this.init(id);
    };
    
CollectEnergy.prototype = Object.create(Task.prototype);
CollectEnergy.prototype.constructor = CollectEnergy;

CollectEnergy.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);

    this.type = "collectEnergy";
    this.id = id;
    this.object = Game.getObjectById(id);
};

CollectEnergy.prototype.canAssign = function(creep) {
    "use strict";

    var energy;
    
    if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
        return false;
    }

    if (!this.object) {
        return false;
    }
    
    energy = this.object.energy;
    if (energy === undefined) {
        energy = this.object.store[RESOURCE_ENERGY] || 0;
    }

    if (energy === 0) {
        return false;
    }

    Cache.creepTasks[creep.name] = this;
    this.toObj(creep);
    return true;
};

CollectEnergy.prototype.run = function(creep) {
    "use strict";

    var obj = this.object,
        energy, resources;

    // If the creep is about to die or if the object doesn't exist, complete.
    if (creep.ticksToLive < 150 || !obj) {
        delete creep.memory.currentTask;
        return;
    }

    energy = obj.energy || obj.store[RESOURCE_ENERGY] || 0;

    // If the creep is full on capacity or the energy is empty, complete.
    if (_.sum(creep.carry) === creep.carryCapacity || energy === 0) {
        delete creep.memory.currentTask;
        return;
    }

    // Move to the object and collect from it.
    Pathing.moveTo(creep, obj, 1);

    // If we are 1 square from the goal, check to see if there's a resource on it and pick it up.
    if (creep.pos.getRangeTo(obj) === 1) {
        if ((resources = _.filter(obj.pos.lookFor(LOOK_RESOURCES), (r) => r.amount > 50)).length > 0) {
            creep.pickup(resources[0]);
            return;
        }
    }

    if (creep.withdraw(obj, RESOURCE_ENERGY) === OK) {
        delete creep.memory.currentTask;
    }
};

CollectEnergy.prototype.toObj = function(creep) {
    "use strict";

    if (this.object) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        };
    } else {
        delete creep.memory.currentTask;
    }
};

CollectEnergy.fromObj = function(creep) {
    "use strict";

    return new CollectEnergy(creep.memory.currentTask.id);
};

CollectEnergy.getTasks = function(room) {
    "use strict";

    return _.map(_.filter([].concat.apply([], [_.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] >= 500), room.storage ? [room.storage] : []]), (c) => c.store[RESOURCE_ENERGY] && c.store[RESOURCE_ENERGY] > 0).sort((a, b) => (b.structureType === STRUCTURE_STORAGE ? 2000 : 0 + b.store[RESOURCE_ENERGY]) - (a.structureType === STRUCTURE_STORAGE ? 2000 : 0 + a.store[RESOURCE_ENERGY])), (c) => new CollectEnergy(c.id));
};

CollectEnergy.getStorerTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] && c.store[RESOURCE_ENERGY] >= 500), (c) => new CollectEnergy(c.id));
};

CollectEnergy.getCleanupTasks = function(structures) {
    "use strict";

    return _.map(_.filter(structures, (s) => s.energy || (s.store && s.store[RESOURCE_ENERGY])).sort((a, b) => (a.energy || a.store[RESOURCE_ENERGY]) - (b.energy || b.store[RESOURCE_ENERGY])), (s) => new CollectEnergy(s.id));
};

require("screeps-profiler").registerObject(CollectEnergy, "TaskCollectEnergy");
module.exports = CollectEnergy;
