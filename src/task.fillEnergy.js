var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
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

    var minEnergy;

    if (creep.spawning || !creep.carry[RESOURCE_ENERGY]) {
        return false;
    }

    if (this.object instanceof StructureExtension) {
        switch (this.object.room.controller.level) {
            case 7:
                minEnergy = 100;
                break;
            case 8:
                minEnergy = 200;
                break;
            default:
                minEnergy = 50;
                break;
        }
        if (creep.carry[RESOURCE_ENERGY] < minEnergy) {
            return false;
        }
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

    // Move to the object and fill it.
    Pathing.moveTo(creep, this.object, 1);
    if (creep.transfer(this.object, RESOURCE_ENERGY) === OK) {
        Task.prototype.complete.call(this, creep);
    }
};

FillEnergy.prototype.canComplete = function(creep) {
    "use strict";

    var minEnergy;

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


    if (this.object instanceof StructureExtension) {
        switch (this.object.room.controller.level) {
            case 7:
                minEnergy = 100;
                break;
            case 8:
                minEnergy = 200;
                break;
            default:
                minEnergy = 50;
                break;
        }
        if (creep.carry[RESOURCE_ENERGY] < minEnergy) {
            Task.prototype.complete.call(this, creep);
            return true;
        }
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

    return _.map(_.sortBy(_.filter(Cache.towersInRoom(room), (t) => t.energy / t.energyCapacity < 0.8), (t) => t.energy), (t) => new FillEnergy(t.id));
};

FillEnergy.getFillLabTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.labsInRoom(room), (t) => t.energy < t.energyCapacity), (t) => new FillEnergy(t.id));
};

FillEnergy.getFillContainerTasks = function(room) {
    "use strict";

    return _.map(_.sortBy(_.filter([].concat.apply([], [Cache.containersInRoom(room), room.storage ? [room.storage] : []]), (c) => (_.sum(c.store) < c.storeCapacity)), (c) => c instanceof StructureStorage ? 1 : 2), (c) => new FillEnergy(c.id));
};

FillEnergy.getFillStorageTasks = function(room) {
    "use strict";

    if (room.storage && _.sum(room.storage.store) < room.storage.storeCapacity) {
        return [new FillEnergy(room.storage.id)];
    } else {
        return [];
    }
};

FillEnergy.getFillLinkTask = function(fromRoom, toRoom) {
    "use strict";

    var links;

    if (fromRoom.unobservable) {
        return null;
    }

    if (Cache.spawnsInRoom(toRoom).length > 0) {
        links = Utilities.objectsClosestToObj(Cache.linksInRoom(toRoom), Cache.spawnsInRoom(toRoom)[0]);
        links.shift();
        _.remove(links, (l) => l.energy === l.energyCapacity);
        if (links.length === 1) {
            return new FillEnergy(links[0].id);
        } else if (links.length > 1) {
            return new FillEnergy(Utilities.objectsClosestToObjByPath(links, fromRoom.find(FIND_SOURCES)[0])[0].id);
        }
    }

    return null;
};

require("screeps-profiler").registerObject(FillEnergy, "TaskFillEnergy");
module.exports = FillEnergy;
