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

    Task.prototype.assign.call(this, creep);
    return true;
};

CollectEnergy.prototype.run = function(creep) {
    "use strict";

    var resources;

    // Object not found, complete task.
    if (!this.object) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Move to the object and collect from it.
    Pathing.moveTo(creep, this.object, 1);

    // If we are 1 square from the goal, check to see if there's a resource on it and pick it up.
    if (creep.pos.getRangeTo(this.object) === 1) {
        if ((resources = _.filter(this.object.pos.lookFor(LOOK_RESOURCES), (r) => r.amount > 50)).length > 0) {
            creep.pickup(resources[0]);
            return;
        }
    }

    if (creep.withdraw(this.object, RESOURCE_ENERGY) === OK) {
        Task.prototype.complete.call(this, creep);
    }
};

CollectEnergy.prototype.canComplete = function(creep) {
    "use strict";

    // If the creep is about to die or if the object doesn't exist, complete.
    if (creep.ticksToLive < 150 || !this.object) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

    // Check the object's energy.
    var energy = this.object.energy;
    if (energy === undefined) {
        energy = this.object.store[RESOURCE_ENERGY] || 0;
    }

    // If the creep is full on capacity or the energy is empty, complete.
    if (_.sum(creep.carry) === creep.carryCapacity || energy === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
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

    return _.map(_.filter([].concat.apply([], [_.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] >= 500), room.storage ? [room.storage] : []]), (c) => c.store[RESOURCE_ENERGY] && c.store[RESOURCE_ENERGY] > 0).sort((a, b) => (b instanceof StructureStorage ? 2000 : 0 + b.store[RESOURCE_ENERGY]) - (a instanceof StructureStorage ? 2000 : 0 + a.store[RESOURCE_ENERGY])), (c) => new CollectEnergy(c.id));
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
