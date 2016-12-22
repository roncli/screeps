var TaskHeal = require("task.heal"),
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),

    Maps = {
        newTaskHeal: (c) => {
            return new TaskHeal(c.id);
        },
        
        newTaskMeleeAttack: (c) => {
            return new TaskMeleeAttack(c.id);
        },
        
        newTaskRangedAttack: (c) => {
            return new TaskRangedAttack(c.id);
        },
        
        newTaskRally: (c) => {
            new TaskRally(c.id);
        }
    };

require("screeps-profiler").registerObject(Maps, "Maps");
module.exports = Maps;
