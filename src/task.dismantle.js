var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Dismantle = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Dismantle.prototype = Object.create(Task.prototype);
Dismantle.prototype.constructor = Dismantle;

Dismantle.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);

    this.type = "dismantle";
    this.id = id;
    this.structure = Game.getObjectById(id);
    this.force = true;
};

Dismantle.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || creep.carryCapacity > 0 && _.sum(creep.carry) === creep.carryCapacity || creep.spawning || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Cache.creepTasks[creep.name] = this;
    this.toObj(creep);
    return true;
};

Dismantle.prototype.run = function(creep) {
    "use strict";
    
    var structure = this.structure;

    // If we're at capacity, the structure is destroyed, or we have no WORK parts, we're done.
    if (_.sum(creep.carry) === creep.carryCapacity || !this.structure || creep.getActiveBodyparts(WORK) === 0) {
        delete creep.memory.currentTask;
        return;
    }
    
    // Move to the structure and dismantle it.
    Pathing.moveTo(creep, structure, 1);
    creep.dismantle(structure);
    
    // If the unit can destroy the structure, complete the task.
    if (Math.min(creep.getActiveBodyparts(WORK), creep.carry[RESOURCE_ENERGY]) * 50 >= structure.hits) {
        delete creep.memory.currentTask;
        return;
    }
};

Dismantle.prototype.toObj = function(creep) {
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

Dismantle.fromObj = function(creep) {
    "use strict";

    return new Dismantle(creep.memory.currentTask.id);
};

Dismantle.getCleanupTasks = function(structures) {
    "use strict";

    return _.map(structures, (s) => new Dismantle(s.id));
};

require("screeps-profiler").registerObject(Dismantle, "TaskDismantle");
module.exports = Dismantle;
