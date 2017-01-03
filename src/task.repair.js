var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Repair = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Repair.prototype = Object.create(Task.prototype);
Repair.prototype.constructor = Repair;

Repair.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);

    this.type = "repair";
    this.id = id;
    this.structure = Game.getObjectById(id);
};

Repair.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.carry[RESOURCE_ENERGY] === 0 || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }

    // Do not repair structures over 1000000 if you are a worker in the home room when the RCL isn't 8 and you don't have the appropriate boost.
    if (this.structure.hits >= 1000000 && creep.memory.role === "worker" && creep.room.name === creep.memory.home && creep.room.controller.level < 8 && !_.find(creep.body, (b) => b.type === WORK && [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE].indexOf(b.boost) !== -1)) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
};

Repair.prototype.run = function(creep) {
    "use strict";

    // Check for destroyed structure.
    if (!this.structure) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Move to the structure and repair it.
    Pathing.moveTo(creep, this.structure, Math.max(Math.min(creep.pos.getRangeTo(this.structure) - 1, 3), 1));
    creep.repair(this.structure);
};

Repair.prototype.canComplete = function(creep) {
    "use strict";

    if (!creep.carry[RESOURCE_ENERGY] || !this.structure || this.structure.hits === this.structure.hitsMax || creep.getActiveBodyparts(WORK) === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Repair.prototype.toObj = function(creep) {
    "use strict";

    if (this.structure) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.structure.id
        };
    } else {
        delete creep.memory.currentTask;
    }
};

Repair.fromObj = function(creep) {
    "use strict";

    return new Repair(creep.memory.currentTask.id);
};

Repair.getTowerTasks = function(room) {
    "use strict";

    return _.map(_.take(_.sortBy(_.filter(Cache.repairableStructuresInRoom(room), (s) => s.hits < 10000 && s.hits / s.hitsMax < 0.25), (s) => s.structure.hits), 5), (s) => new Repair(s.id));
};

Repair.getCriticalTasks = function(room) {
    "use strict";

    return _.map(_.take(_.sortBy(_.filter(Cache.repairableStructuresInRoom(room), (s) => s.hits < 100000 && s.hits / s.hitsMax < 0.5), (s) => s.structure.hits), 5), (s) => new Repair(s.id));
};

Repair.getTasks = function(room) {
    "use strict";

    return _.map(_.take(_.sortBy(_.filter(Cache.repairableStructuresInRoom(room), (s) => s.hits / s.hitsMax < 0.9 || s.hitsMax - s.hits > 100000), (s) => s.structure.hits), 5), (s) => new Repair(s.id));
};

require("screeps-profiler").registerObject(Repair, "TaskRepair");
module.exports = Repair;
