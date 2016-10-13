var Task = require("task"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    Rally = function(id, creep) {
        Task.call(this);

        this.type = "rally";
        this.id = id;
        this.creep = creep;
        this.rallyPoint = Cache.getObjectById(id);
        if (!this.rallyPoint) {
            this.rallyPoint = Game.flags[id];
        }
        if (!this.rallyPoint) {
            this.rallyPoint = new RoomPosition(25, 25, id);
        }
    };
    
Rally.prototype = Object.create(Task.prototype);
Rally.prototype.constructor = Rally;

Rally.prototype.canAssign = function(creep) {
    "use strict";

    Task.prototype.assign.call(this, creep);
    return true;
}

Rally.prototype.run = function(creep) {
    "use strict";

    // If the rally point doesn't exist, complete the task.
    if (!this.rallyPoint) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Rally to the rally point.
    if (this.rallyPoint instanceof RoomPosition) {
        creep.moveTo(this.rallyPoint, {reusePath: Math.floor(Math.random() * 2) + 1});
    } else {
        creep.moveTo(this.rallyPoint.pos.x + Math.floor(Math.random() * 7 - 3), this.rallyPoint.pos.y + Math.floor(Math.random() * 7 - 3), {reusePath: Math.floor(Math.random() * 2) + 1});
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
        }
    } else {
        delete creep.memory.currentTask;
    }
};

Rally.fromObj = function(creep) {
    "use strict";

    return new Rally(creep.memory.currentTask.id);
};

Rally.getHealerTasks = function(room) {
    "use strict";

    var flags = Cache.flagsInRoom(room),
        targets, rallyPoint;
    
    // If there are no flags, there is nothing for anyone to rally to.
    if (flags.length === 0) {
        return [];
    }

    // Find a rally target.
    targets = Cache.creepsInRoom("rangedAttack", room);
    if (targets.length === 0) {
        targets = Cache.creepsInRoom("meleeAttack", room);
    }

    // Return the rally point.
    if (targets.length === 0) {
        return [new Rally(flags[0].name)];
    } else {
        return [new Rally(Utilities.objectsClosestToObj(targets, flags[0])[0].id)];
    }
};

Rally.getAttackerTasks = function(room) {
    "use strict";

    var flags = Cache.flagsInRoom(room);

    // If there are no flags, there is nothing for anyone to rally to.
    if (flags.length === 0) {
        return [];
    }

    // Return the rally point.
    return [new Rally(flags[0].name)];
};

Rally.getHarvesterTasks = function(creeps) {
    "use strict";

    return _.map(_.filter(creeps, (c) => c.ticksToLive >= 150), (c) => new Rally(c.memory.home, c));
};

Rally.getRoamerTask = function(creep) {
    "use strict";

    return new Rally(creep.memory.defending, creep);
};

require("screeps-profiler").registerObject(Rally, "TaskRally");
module.exports = Rally;
