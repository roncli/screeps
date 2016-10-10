var Task = require("task"),
    Cache = require("cache"),
    FillEnergy = function(id) {
        Task.call(this);

        this.type = "fillEnergy";
        this.id = id;
        this.object = Cache.getObjectById(id);
    };
    
FillEnergy.prototype = Object.create(Task.prototype);
FillEnergy.prototype.constructor = FillEnergy;

FillEnergy.prototype.canAssign = function(creep) {
    "use strict";

    if (!creep.carry[RESOURCE_ENERGY]) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

FillEnergy.prototype.run = function(creep) {
    "use strict";

    // Object not found, complete task.
    if (!this.object) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Fill the object, or move closer to it if not in range.
    if (creep.transfer(this.object, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.object, {reusePath: Math.floor(Math.random() * 2) + 1});
        return;
    }

    // If we didn't move, complete task.
    Task.prototype.complete.call(this, creep);
};

FillEnergy.prototype.canComplete = function(creep) {
    "use strict";

    var energy = this.object.energy;
    if (energy === undefined) {
        energy = this.object.store[RESOURCE_ENERGY] || 0;
    }

    if (!creep.carry[RESOURCE_ENERGY] || energy === (this.object.energyCapacity || this.object.storeCapacity)) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

FillEnergy.prototype.toObj = function(creep) {
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

FillEnergy.fromObj = function(creep) {
    "use strict";

    return new FillEnergy(creep.memory.currentTask.id);
};

FillEnergy.getFillExtensionTasks = function(room) {
    "use strict";

    return _.map(_.sortBy(_.filter(Cache.extensionsInRoom(room), (e) => e.energy < e.energyCapacity), (e) => 50 * e.pos.x + e.pos.y), (e) => new FillEnergy(e.id));
};

FillEnergy.getFillSpawnTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.spawnsInRoom(room), (s) => s.energy < s.energyCapacity), (s) => new FillEnergy(s.id));
};

FillEnergy.getFillTowerTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.towersInRoom(room), (t) => t.energy / t.energyCapacity < 0.8), (t) => new FillEnergy(t.id));
};

FillEnergy.getFillContainerTasks = function(room) {
    "use strict";

    return _.map(_.sortBy(_.filter([].concat.apply([], [Cache.containersInRoom(room), room.storage ? [room.storage] : []]), (c) => (c.store[RESOURCE_ENERGY] || 0) < c.storeCapacity), (c) => new FillEnergy(c.id), (c) => c.structureType === STRUCTURE_STORAGE ? 1 : 2));
};

require("screeps-profiler").registerObject(FillEnergy, "TaskFillEnergy");
module.exports = FillEnergy;
