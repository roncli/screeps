var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities"),
    Build = function(id) {
        "use strict";
    
        this.init(id);
    };

Build.prototype = Object.create(Task.prototype);
Build.prototype.constructor = Build;

Build.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);

    this.type = "build";
    this.id = id;
    this.constructionSite = Game.getObjectById(id);
};

Build.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Build.prototype.run = function(creep) {
    "use strict";

    var site = this.constructionSite;

    // Check for complete construction.
    if (!site) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Move to the construction site and build it.
    Pathing.moveTo(creep, site, Math.max(Math.min(creep.pos.getRangeTo(site) - 1, 3), 1));
    creep.build(site, RESOURCE_ENERGY);
};

Build.prototype.canComplete = function(creep) {
    "use strict";

    if (!creep.carry[RESOURCE_ENERGY] || !this.constructionSite || creep.getActiveBodyparts(WORK) === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Build.prototype.toObj = function(creep) {
    "use strict";

    if (this.constructionSite) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        }
    } else {
        delete creep.memory.currentTask;
    }
};

Build.fromObj = function(creep) {
    "use strict";

    return new Build(creep.memory.currentTask.id);
};

Build.getTasks = function(room) {
    "use strict";

    return _.map(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => new Build(s.id));
};

require("screeps-profiler").registerObject(Build, "TaskBuild");
module.exports = Build;
