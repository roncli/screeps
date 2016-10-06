var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),

    Healer = {
        checkSpawn: (room) => {
            var count;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If we have less than max healers, spawn a healer.
            count = Cache.creepsInRoom("healer", room).length;
            if (count < Memory.maxCreeps.healer) {
                Healer.spawn(room);
            }

            // Output healer count in the report.
            console.log("    Healers: " + count.toString() + "/" + Memory.maxCreeps.healer.toString());        
        },
        
        spawn: (room) => {
            var body = [],
                structures, energy, count;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning).length === 0) {
                return false;
            }

            // Get the spawns and extensions in the room.
            structures = [].concat.apply([], [Cache.spawnsInRoom(room), Cache.extensionsInRoom(room)]);

            // Fail if any of the structures aren't full.
            if (_.filter(structures, (s) => s.energy !== s.energyCapacity).length !== 0) {
                return false;
            }

            // Get the total energy in the room.
            energy = _.reduce(structures, function(sum, s) {return sum + s.energy;}, 0);

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 450); count++) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            if (energy % 450 >= 200 && energy % 450 < 300) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            for (count = 0; count < Math.floor(energy / 450); count++) {
                body.push(HEAL);
            }

            if (energy % 450 >= 300) {
                body.push(HEAL);
            }

            for (count = 0; count < Math.floor(energy / 450); count++) {
                body.push(MOVE);
                body.push(MOVE);
                body.push(MOVE);
            }

            if (energy % 450 >= 50) {
                body.push(MOVE);
            }

            if ((energy % 450 >= 100 && energy % 450 < 300) || (energy % 450 >= 350)) {
                body.push(MOVE);
            }

            if ((energy % 450 >= 150 && energy % 450 < 300) || (energy % 450 >= 400)) {
                body.push(MOVE);
            }

            if (energy % 450 >= 250 && energy % 450 < 300) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning)[0];
            name = spawnToUse.createCreep(body, undefined, {role: "healer"});

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new healer " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, creepTasks) => {
            var tasks;

            // Find allies to heal.
            tasks = TaskHeal.getTasks(room);
            if (tasks.length > 0) {
                console.log("    Creeps to heal: " + tasks.length);
                _.forEach(_.take(tasks, 5), (task) => {
                    console.log("      " + task.ally.pos.x + "," + task.ally.pos.y + " " + task.ally.hits + "/" + task.ally.hitsMax + " " + (100 * task.ally.hits / task.ally.hitsMax).toFixed(3) + "%");
                });
            }
            _.forEach(tasks, (task) => {
                var hitsMissing = task.ally.hitsMax - task.ally.hits - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("healer", room), {type: "heal", id: task.id}), function(sum, c) {return sum + c.getActiveBodyparts(HEAL) * 12;}, 0);
                if (hitsMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("healer", room)), task.id), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Heal");
                            hitsMissing -= c.getActiveBodyparts(HEAL) * 12;
                            if (hitsMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Rally the troops!
            tasks = TaskRally.getHealerTasks(room);
            _.forEach(tasks, (task) => {
                _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("healer", room)), (creep) => {
                    task.canAssign(creep, creepTasks);
                });
            });
        }
    };

module.exports = Healer;
