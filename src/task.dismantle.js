var Task = require("task"),
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
};

Dismantle.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || (creep.carryCapacity > 0 && _.sum(creep.carry) === creep.carryCapacity) || creep.getActiveBodyparts(WORK) === 0 || creep.spawning) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
};

Dismantle.prototype.run = function(creep) {
    "use strict";

    // Check for destroyed structure.
    if (!this.structure) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Move to the structure and dismantle it.
    Pathing.moveTo(creep, this.structure, 1);
    creep.dismantle(this.structure);
};

Dismantle.prototype.canComplete = function(creep) {
    "use strict";

    if (_.sum(creep.carry) === creep.carryCapacity || !this.structure || creep.getActiveBodyparts(WORK) === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Dismantle.prototype.toObj = function(creep) {
    "use strict";

    if (this.structure) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.structure.id
        }
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
