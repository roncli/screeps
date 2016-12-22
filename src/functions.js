var Functions = {
    filterIsContainer: (s) => {
        return s instanceof StructureContainer;
    },
    
    filterIsExtension: (s) => {
        return s instanceof StructureExtension;
    },
    
    filterIsExtractor: (s) => {
        return s instanceof StructureExtractor;
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
        return !c.owner || Memory.allies.indexOf(c.owner.username) === -1
    },
    
    filterNotControllerOrRampart: (s) => {
        return !(s instanceof StructureController) && !(s instanceof StructureRampart)
    },
    
    filterNotMaxHits: (o) => {
        return o.hits < o.hitsMax;
    },
    
    sortMostMissingHits: (o) => {
        return -(o.hitsMax - o.hits);
    }
};

require("screeps-profiler").registerObject(Functions, "Functions");
module.exports = Functions;
