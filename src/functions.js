var TaskHeal = require("task.heal"),
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),

    Functions = {
        filterIsContainer: (s) => {
            return s instanceof StructureContainer;
        },
        
        filterIsExtension: (s) => {
            return s instanceof StructureExtension;
        },
        
        filterIsExtractor: (s) => {
            s instanceof StructureExtractor;
        },
        
        filterIsLab: (s) => {
            return s instanceof StructureLab;
        },
        
        filterIsLink: (s) => {
            return s instanceof StructureLink;
        },
        
        filterIsRepairable: (s) => {
            return ((s.my || s instanceof StructureWall || s instanceof StructureRoad || s instanceof StructureContainer) && s.hits);
        },
        
        filterIsSpawn: (s) => {
            return s instanceof StructureSpawn;
        },
        
        filterIsTower: (s) => {
            return s instanceof StructureTower;
        },

        filterNotAllied: (c) => {
            !c.owner || Memory.allies.indexOf(c.owner.username) === -1
        },
        
        filterNotControllerOrRampart: (s) => {
            return !(s instanceof StructureController) && !(s instanceof StructureRampart)
        },
        
        filterNotMaxHits: (o) => {
            return o.hits < o.hitsMax;
        },
        
        sortMostMissingHits: (o) => {
            return -(o.hitsMax - o.hits);
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
