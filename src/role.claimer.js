var Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskClaim = require("task.claim");

class Claimer {
    static checkSpawn(room) {
        var claimer = Memory.maxCreeps.claimer,
            roomName = room.name,
            claimers = Cache.creeps[roomName] && Cache.creeps[roomName].claimer || [],
            num = 0,
            max = 0;
        
        // Loop through the room claimers to see if we need to spawn a creep.
        if (claimer) {
            _.forEach(claimer[roomName], (value, toRoom) => {
                var count = _.filter(claimers, (c) => c.memory.claim === toRoom).length;

                num += count;
                max += 1;

                if (count === 0) {
                    Claimer.spawn(room, toRoom);
                }
            });
        }

        // Output claimer count in the report.
        if (Memory.log && (claimers.length > 0 || max > 0)) {
            Cache.log.rooms[roomName].creeps.push({
                role: "claimer",
                count: claimers.length,
                max: max
            });
        }        
    }

    static spawn(room, toRoom) {
        var spawns = Cache.spawnsInRoom(room),
            body = [CLAIM, MOVE],
            spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `claimer-${toRoom}-${Game.time.toFixed(0).substring(4)}`, {role: "claimer", home: room.name, claim: toRoom});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].claimer || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If the creeps are not in the room, rally them.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.claim), (creep) => {
            var task = TaskRally.getClaimerTask(creep);
            if (task.canAssign(creep)) {
                assigned.push(creep.name);
            };
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Claim the controller.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = TaskClaim.getTask(creep);
            if (task.canAssign(creep)) {
                creep.say("Claiming");
                assigned.push(creep.name);
            };
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If we have claimed, set the room as a base, stop trying to claim the room, and suicide any remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name === creep.memory.claim && creep.room.controller.my) {
                creep.suicide();
            }
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Claimer, "RoleClaimer");
}
module.exports = Claimer;
