var TaskHeal = require("task.heal"),
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),

    Functions = {
        filterNotMaxHits: (c) => {
            return c.hits < c.hitsMax;
        },
        
        sortMostMissingHits: (c) => {
            return -(c.hitsMax - c.hits);
        },
        
        mapNewTaskHeal: (c) => {
            return new TaskHeal(c.id);
        },
        
        mapNewTaskMeleeAttack: (c) => {
            return new TaskMeleeAttack(c.id);
        },
        
        mapNewTaskRangedAttack: (c) => {
            return new TaskRangedAttack(c.id);
        },
        
        mapNewTaskRally: (c) => {
            new TaskRally(c.id);
        }
    };

require("screeps-profiler").registerObject(Functions, "Functions");
module.exports = Functions;
