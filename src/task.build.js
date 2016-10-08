var Task = require("task"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    Build = function(id) {
        Task.call(this);

        this.type = "build";
        this.id = id;
        this.constructionSite = Cache.getObjectById(id);
    };
    
Build.prototype = Object.create(Task.prototype);
Build.prototype.constructor = Build;

Build.prototype.canAssign = function(creep) {
    if (!creep.carry[RESOURCE_ENERGY]) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Build.prototype.run = function(creep) {
    // Check for complete construction.
    if (!this.constructionSite) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Build the site, or move closer to it if not in range.
    if (creep.build(this.constructionSite, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.constructionSite, {reusePath: Math.floor(Math.random() * 2)});
    }
};

Build.prototype.canComplete = function(creep) {
    if (!creep.carry[RESOURCE_ENERGY] || !this.constructionSite) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Build.prototype.toObj = function(creep) {
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
    return new Build(creep.memory.currentTask.id);
};

Build.getTasks = function(room) {
    return Utilities.objectsClosestToObj(_.map(Cache.constructionSitesInRoom(room), (s) => new Build(s.id)), Cache.spawnsInRoom[0] || Cache.energySourcesInRoom[0]);
};

require("screeps-profiler").registerObject(Build, "TaskBuild");
module.exports = Build;
