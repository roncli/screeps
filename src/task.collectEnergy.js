var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities"),
    CollectEnergy = function(id) {
        Task.call(this);

        this.type = "collectEnergy";
        this.id = id;
        this.object = Cache.getObjectById(id);
    };
    
CollectEnergy.prototype = Object.create(Task.prototype);
CollectEnergy.prototype.constructor = CollectEnergy;

CollectEnergy.prototype.canAssign = function(creep) {
    "use strict";

    var energy;
    
    if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
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
}

CollectEnergy.prototype.run = function(creep) {
    "use strict";

    // Object not found, complete task.
    if (!this.object) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Move to the object and collect from it.
    Pathing.moveTo(creep, this.object, 1);
    creep.withdraw(this.object, RESOURCE_ENERGY);

    // If we didn't move, complete task.
    Task.prototype.complete.call(this, creep);
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
        }
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

    return _.map(_.sortBy(_.filter([].concat.apply([], [Cache.containersInRoom(room), room.storage ? [room.storage] : []]), (c) => c.store[RESOURCE_ENERGY] && c.store[RESOURCE_ENERGY] > 0), (c) => -(c.structureType === STRUCTURE_STORAGE ? 2000 : 0 + c.store[RESOURCE_ENERGY])), (c) => new CollectEnergy(c.id));
};

CollectEnergy.getStorerTasks = function(room) {
    "use strict";

    var tasks = _.map(_.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] && c.store[RESOURCE_ENERGY] > 0), (c) => new CollectEnergy(c.id)),
        links;

    if (Cache.spawnsInRoom(room).length > 0) {
        links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), Cache.spawnsInRoom(room)[0]);
        if (links.length > 0 && links[0].energy > 0) {
            tasks.push(new CollectEnergy(links[0].id));
        }
    }
    
    return tasks;
};

require("screeps-profiler").registerObject(CollectEnergy, "TaskCollectEnergy");
module.exports = CollectEnergy;
