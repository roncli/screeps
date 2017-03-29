var Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities"),
    FillEnergy = function(id) {
        "use strict";
        
        this.init(id);
    };
    
FillEnergy.prototype.init = function(id) {
    "use strict";
    
    this.type = "fillEnergy";
    this.id = id;
    this.object = Game.getObjectById(id);
};

FillEnergy.prototype.canAssign = function(creep) {
    "use strict";

    var minEnergy;

    if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || (this.object.energyCapacity && this.object.energy === this.object.energyCapacity)) {
        return false;
    }

    if (this.object.structureType === STRUCTURE_EXTENSION) {
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
    
    Cache.creepTasks[creep.name] = this;
    this.toObj(creep);
    return true;
};

FillEnergy.prototype.run = function(creep) {
    "use strict";
    
    var obj = this.object;

    // If the object is at capacity, we're done.
    if ((obj.energy || _.sum(obj.store)) === (obj.energyCapacity || obj.storeCapacity)) {
        delete creep.memory.currentTask;
        return;
    }

    // Object not found or we have no energy, complete task.
    if (!obj || !creep.carry[RESOURCE_ENERGY]) {
        delete creep.memory.currentTask;
        return;
    }

    // Move to the object and fill it.
    Pathing.moveTo(creep, obj, 1);
    if (creep.transfer(obj, RESOURCE_ENERGY) === OK) {
        delete creep.memory.currentTask;
    }
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

FillEnergy.getExtensionTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.extensionsInRoom(room), (e) => e.energy < e.energyCapacity), (e) => new FillEnergy(e.id));
};

FillEnergy.getSpawnTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.spawnsInRoom(room), (s) => s.energy < s.energyCapacity), (s) => new FillEnergy(s.id));
};

FillEnergy.getTowerTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.towersInRoom(room), (t) => t.energy / t.energyCapacity < 0.8).sort((a, b) => a.energy - b.energy), (t) => new FillEnergy(t.id));
};

FillEnergy.getLabTasks = function(room) {
    "use strict";

    return _.map(_.filter(Cache.labsInRoom(room), (t) => t.energy < t.energyCapacity), (t) => new FillEnergy(t.id));
};

FillEnergy.getContainerTasks = function(room) {
    "use strict";
    
    var containers = _.filter(Cache.containersInRoom(room), (c) => _.sum(c.store) < c.storeCapacity);
    
    if (room.storage && _.sum(room.storage.store) < room.storage.storeCapacity) {
        containers.unshift(room.storage);
    }

    return _.map(containers, (c) => new FillEnergy(c.id));
};

FillEnergy.getStorageTasks = function(room) {
    "use strict";

    if (room.storage && _.sum(room.storage.store) < room.storage.storeCapacity) {
        return [new FillEnergy(room.storage.id)];
    } else {
        return [];
    }
};

FillEnergy.getLinkTasks = function(room) {
    "use strict";

    var links = Cache.linksInRoom(room),
        spawns = Cache.spawnsInRoom(room);

    if (links.length === 0 || spawns.length === 0) {
        return [];
    }

    links = Utilities.objectsClosestToObj(links, spawns[0]);
    return [new FillEnergy(links[0].id)];
};

FillEnergy.getNukerTasks = function(room) {
    "use strict";

    var nukers = Cache.nukersInRoom(room);

    if (nukers.length === 0) {
        return [];
    }

    return [new FillEnergy(nukers[0].id)];
};

FillEnergy.getPowerSpawnTasks = function(room) {
    "use strict";

    var spawns = Cache.powerSpawnsInRoom(room);

    if (spawns.length === 0) {
        return [];
    }

    return [new FillEnergy(spawns[0].id)];
};

if (Memory.profiling) {
    require("screeps-profiler").registerObject(FillEnergy, "TaskFillEnergy");
}
module.exports = FillEnergy;
