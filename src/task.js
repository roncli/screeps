var Cache = require("cache"),
    Task = function() {};

Task.prototype.assign = function(creep) {
    Cache.tasks[creep.name] = this;
    this.toObj(creep);
}

Task.prototype.complete = function(creep) {
    delete creep.memory.currentTask;
};

Task.prototype.run = function(creep) {};

require("screeps-profiler").registerObject(Task, "Task");
module.exports = Task;
