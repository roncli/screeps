var Task = function() {};

Task.prototype.assign = function(creep, tasks) {
    tasks[creep.name] = this;
    this.toObj(creep);
}

Task.prototype.complete = function(creep) {
    delete creep.memory.currentTask;
};

Task.prototype.run = function(creep) {};

module.exports = Task;
