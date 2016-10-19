var Task = require("task"),
    Cache = require("cache"),
    Utilities = require("utilities"),
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
        creep.moveTo(this.object, {reusePath: Math.floor(Math.random() * 2) + 4});
        return;
    }

    // If we didn't move, complete task.
    Task.prototype.complete.call(this, creep);
};

FillEnergy.prototype.canComplete = function(creep) {
    "use strict";

    if (!this.object) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

    var energy = this.object.energy;
    if (energy === undefined) {
        energy = _.sum(this.object.store);
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

    return _.map(_.sortBy(_.filter([].concat.apply([], [Cache.containersInRoom(room), room.storage ? [room.storage] : []]), (c) => (_.sum(c.store) < c.storeCapacity)), (c) => c.structureType === STRUCTURE_STORAGE ? 1 : 2), (c) => new FillEnergy(c.id));
};

FillEnergy.getFillStorageTasks = function(room) {
    "use strict";

    if (room.storage && _.sum(room.storage.store) < room.storage.storeCapacity) {
        return [new FillEnergy(room.storage.id)];
    } else {
        return [];
    }
};

FillEnergy.getFillLinkTask = function(room) {
    "use strict";

    var links;

    if (Cache.spawnsInRoom(room).length > 0) {
        links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), Cache.spawnsInRoom(room)[0]);
        if (links.length > 0 && links[1].energy < links[1].energyCapacity) {
            return new FillEnergy(links[1].id);
        }
    }

    return null;
}

require("screeps-profiler").registerObject(FillEnergy, "TaskFillEnergy");
module.exports = FillEnergy;
