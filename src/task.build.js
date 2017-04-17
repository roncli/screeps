var Cache = require("cache"),
    Pathing = require("pathing");

class Build {
    constructor(id) {
        this.type = "build";
        this.id = id;
        this.constructionSite = Game.getObjectById(id);
        this.force = true;
    }

    canAssign(creep) {
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }

    run(creep) {
        var site = this.constructionSite;

        // Complete task if we're out of energy, the site is gone, or we can't do the work.
        if (!creep.carry[RESOURCE_ENERGY] || !site || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }

        // Move to the construction site and build it.
        Pathing.moveTo(creep, site, Math.max(Math.min(creep.pos.getRangeTo(site) - 1, 3), 1));
        if (creep.build(site, RESOURCE_ENERGY) === OK) {
            // If we have the means to complete the construction site or we run out of energy, complete the task.
            if (Math.min(creep.getActiveBodyparts(WORK) * 5, creep.carry[RESOURCE_ENERGY]) >= site.progressTotal - site.progress || creep.carry[RESOURCE_ENERGY] <= Math.min(creep.getActiveBodyparts(WORK) * 5)) {
                delete creep.memory.currentTask;
                return;
            }
        }
    }

    toObj(creep) {
        if (this.constructionSite) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }

    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Build(creep.memory.currentTask.id);
        } else {
            return;
        }
    }

    static getTasks(room) {
        return _.map(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => new Build(s.id));
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Build, "TaskBuild");
}
module.exports = Build;
