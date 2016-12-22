var Filters = {
    isContainer: (s) => {
        return s instanceof StructureContainer;
    },
    
    isExtension: (s) => {
        return s instanceof StructureExtension;
    },
    
    isExtractor: (s) => {
        return s instanceof StructureExtractor;
    },
    
    isLab: (s) => {
        return s instanceof StructureLab;
    },
    
    isLink: (s) => {
        return s instanceof StructureLink;
    },
    
    isRepairable: (s) => {
        return ((s.my || s instanceof StructureWall || s instanceof StructureRoad || s instanceof StructureContainer) && s.hits);
    },
    
    isSpawn: (s) => {
        return s instanceof StructureSpawn;
    },
    
    isTower: (s) => {
        return s instanceof StructureTower;
    },

    notAllied: (c) => {
        return !c.owner || Memory.allies.indexOf(c.owner.username) === -1
    },
    
    notControllerOrRampart: (s) => {
        return !(s instanceof StructureController) && !(s instanceof StructureRampart)
    },
    
    notMaxHits: (o) => {
        return o.hits < o.hitsMax;
    }
};

require("screeps-profiler").registerObject(Filters, "Filters");
module.exports = Filters;
