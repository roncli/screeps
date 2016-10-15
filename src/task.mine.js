var Task = require("task"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    Mine = function() {
        Task.call(this);
        
        this.type = "mine";
    };
    
Mine.prototype = Object.create(Task.prototype);
Mine.prototype.constructor = Mine;

Mine.prototype.canAssign = function(creep) {
    "use strict";

    var container = Cache.getObjectById(creep.memory.container);

    if (!container || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Mine.prototype.run = function(creep) {
    "use strict";

    var container = Cache.getObjectById(creep.memory.container);
    
    // Container is not found, complete the task.
    if (!container) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Move to the container if we are not there.
    if (container.pos.getRangeTo(creep) !== 0) {
        creep.moveTo(container, {reusePath: Math.floor(Math.random() * 2) + 1});
    }

    // If we are at the container, get the source closest to the creep and attempt to harvest it.
    if (container.pos.getRangeTo(creep) === 0) {
        creep.harvest(Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(container.room), Cache.mineralsInRoom(container.room)]), creep)[0]);
    }
};

Mine.prototype.canComplete = function(creep) {
    "use strict";

    var container = Cache.getObjectById(creep.memory.container);

    if (!container) {
        return true;
    }
    return false;
};

Mine.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type
    }
};

Mine.fromObj = function(creep) {
    "use strict";

    return new Mine();
};

require("screeps-profiler").registerObject(Mine, "TaskMine");
module.exports = Mine;
