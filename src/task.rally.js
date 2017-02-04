var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Rally = function(id, creep) {
        "use strict";
        
        this.init(id, creep);
    };
    
Rally.prototype = Object.create(Task.prototype);
Rally.prototype.constructor = Rally;

Rally.prototype.init = function(id, creep) {
    "use strict";
    
    Task.call(this);

    this.type = "rally";
    this.id = id;
    this.creep = creep;
    this.rallyPoint = Game.getObjectById(id);
    if (!this.rallyPoint) {
        this.rallyPoint = new RoomPosition(25, 25, id);
        this.range = 5;
    }
};

Rally.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning) {
        return false;
    }

    Task.prototype.assign.call(this, creep);
    return true;
};

Rally.prototype.run = function(creep) {
    "use strict";
    
    var range;

    // If the rally point doesn't exist, complete the task.
    if (!this.rallyPoint) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Rally to the rally point.
    range = creep.room.name === this.rallyPoint.roomName || !(this.rallyPoint instanceof RoomPosition) || this.rallyPoint.pos && creep.room.name === this.rallyPoint.pos.roomName ? this.range || 0 : 20;
    if (creep.pos.getRangeTo(this.rallyPoint) <= range) {
        if (creep.pos.x === 0) {
            creep.move(RIGHT);
        } else if (creep.pos.x === 49) {
            creep.move(LEFT);
        } else if (creep.pos.y === 0) {
            creep.move(BOTTOM);
        } else if (creep.pos.y === 49) {
            creep.move(TOP);
        } else if (_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureRoad || s instanceof StructureContainer).length > 0) {
            creep.move(Math.floor(Math.random() * 8));
        }
    } else {
        Pathing.moveTo(creep, this.rallyPoint, range);
    }

    // If the creep has a heal part, heal itself.
    if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
        creep.heal(creep);
    }

    // If the creep has a ranged attack part. mass attack.
    if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
        creep.rangedMassAttack();
    }

    // Always complete the task.
    Task.prototype.complete.call(this, creep);
};

Rally.prototype.canComplete = function(creep) {
    "use strict";

    Task.prototype.complete.call(this, creep);
    return true;
};

Rally.prototype.toObj = function(creep) {
    "use strict";

    if (this.rallyPoint) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        };
    } else {
        delete creep.memory.currentTask;
    }
};

Rally.fromObj = function(creep) {
    "use strict";

    return new Rally(creep.memory.currentTask.id);
};

Rally.getHarvesterTasks = function(creeps) {
    "use strict";

    return _.map(_.filter(creeps, (c) => !c.spawning && c.ticksToLive >= 150), (c) => new Rally(c.memory.homeSource, c));
};

Rally.getDefenderTask = function(creep) {
    "use strict";

    if (creep.memory.role === "healer") {
        // Find a rally target.
        var targets = Cache.creeps[creep.room.name] && Cache.creeps[creep.room.name].rangedAttack || [];
        if (targets.length === 0) {
            targets = Cache.creeps[creep.room.name] && Cache.creeps[creep.room.name].meleeAttack || [];
        }
        if (targets.length === 0) {
            targets = Cache.creeps[creep.room.name] && Cache.creeps[creep.room.name].defender || [];
        }

        // Return the rally point.
        if (targets.length === 0) {
            return new Rally(creep.memory.home, creep);
        }
    }

    return new Rally(creep.memory.home, creep);
};

Rally.getSourceDefenderTask = function(creep) {
    "use strict";

    var source = Cache.sourceKeepersInRoom(creep.room).sort((a, b) => a.ticksToSpawn - b.ticksToSpawn)[0];

    if (source) {
        return new Rally(source.id, creep);
    } else {
        return new Rally(creep.memory.home, creep);
    }
};

Rally.getClaimerTask = function(creep) {
    "use strict";

    return new Rally(creep.memory.claim, creep);
};

require("screeps-profiler").registerObject(Rally, "TaskRally");
module.exports = Rally;
