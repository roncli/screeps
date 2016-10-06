var Task = require("task"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    Rally = function(id) {
        Task.call(this);

        this.type = "rally";
        this.id = id;
        this.rallyPoint = Cache.getObjectById(id);
        if (!this.rallyPoint) {
            this.rallyPoint = Game.flags[id];
        }
    };
    
Rally.prototype = Object.create(Task.prototype);
Rally.prototype.constructor = Rally;

Rally.prototype.canAssign = function(creep, tasks) {
    if (["rangedAttack", "healer"].indexOf(creep.memory.role) === -1) {
        return false;
    }

    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Rally.prototype.run = function(creep) {
    // If the rally point doesn't exist, complete the task.
    if (!this.rallyPoint) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Rally to the rally point.
    creep.moveTo(this.rallyPoint.pos.x + Math.floor(Math.random() * 7 - 3), this.rallyPoint.pos.y + Math.floor(Math.random() * 7 - 3), {reusePath: Math.floor(Math.random() * 2)});

    // Always complete the task.
    Task.prototype.complete.call(this, creep);
};

Rally.prototype.canComplete = function(creep) {
    return true;
};

Rally.prototype.toObj = function(creep) {
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
    return new Rally(creep.memory.currentTask.id);
};

Rally.getHealerTasks = function(room) {
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
        return [new Rally(Utilities.objectsClosestToObj(targets, flags[0]).id)];
    }
};

Rally.getAttackerTasks = function(room) {
    var flags = Cache.flagsInRoom(room);

    // If there are no flags, there is nothing for anyone to rally to.
    if (flags.length === 0) {
        return [];
    }

    // Return the rally point.
    return [new Rally(flags[0].name)];
};

Rally.getHarvesterTasks = function(creeps) {
    return _.map(creeps, (c) => new Rally(c.memory.home));
};

module.exports = Rally;
