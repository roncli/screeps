var Sorts = {
    mostMissingHits: (o) => {
        return -(o.hitsMax - o.hits);
    }
};

require("screeps-profiler").registerObject(Sorts, "Sorts");
module.exports = Sorts;
