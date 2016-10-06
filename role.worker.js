var Cache = require("cache");

Worker = {
    checkSpawn: (room) => {
        var count;
        
        // If there are no spawns in the room, ignore them.
        if (Cache.spawnsInRoom(room).length === 0) {
            return;
        }

        count = Cache.creepsInRoom("worker", room).length;
        while (count < Memory.maxCreeps.worker) {
            if (Worker.spawn(room)) {
            }
        }
    },
    
    spawn: (room) => {
        name = Game.spawns["Spawn1"].createCreep([WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], undefined, {role: "worker"});
        if (typeof name !== "number") {
            console.log("Spawning new worker " + name);
        }
        
        count = _.filter(Game.creeps, (creep) => creep.memory.role === "worker").length;
        if (count < Memory.maxCreeps.worker) {
        }
        console.log("Workers: " + count.toString() + "/" + Memory.maxCreeps.worker.toString());        
    }
};

module.exports = Worker;
