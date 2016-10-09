var Cache = require("cache"),
    Task = function() {};

Task.prototype.assign = function(creep) {
    "use strict";

    Cache.creepTasks[creep.name] = this;
    this.toObj(creep);
}

Task.prototype.complete = function(creep) {
    "use strict";

    delete creep.memory.currentTask;
};

require("screeps-profiler").registerObject(Task, "Task");
module.exports = Task;
