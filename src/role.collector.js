var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskHarvest = require("task.harvest"),

    Collector = {
        checkSpawn: (room) => {
            var max = 0,
                count, sources;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If there is only one energy source, ignore the room.
            sources = Utilities.objectsClosestToObj(Cache.energySourcesInRoom(room), Cache.spawnsInRoom(room)[0]);
            if (souces.length <= 1) {
                return;
            }

            //  Loop through sources to see if we have anything we need to spawn.
            _.forEach(sources, (source, index) => {
                // Skip the first index.
                if (index === 0) {
                    return;
                }

                if (!Memory.sources[source.id] && !Memory.sources[source.id].empty) {
                    // Initialize.
                    if (!Memory.sources[source.id]) {
                        Memory.sources[source.id] = {};
                    }

                    // Count the empty squares around the source.
                    Memory.sources[source.id].empty = Utilities.getEmptyPosAroundPos(source.pos);
                }

                max += Memory.sources[source.id].empty;

                // If we have less than max collectors, spawn a collector.
                count = _.filter(Cache.creepsInRoom("collector", room), (c) => c.home === source.id).length;
                if (count < Memory.maxCreeps.collector) {
                    Collector.spawn(room, source.id);
                }
            });

            // Output collector count in the report.
            console.log("    Collectors: " + Cache.creepsInRoom("collector", room).length + "/" + max);        
        },
        
        spawn: (room, id) => {
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
            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(WORK);
            }

            if (energy % 200 >= 150) {
                body.push(WORK);
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(CARRY);
            }

            if (energy % 100 >= 100 && energy % 200 < 150) {
                body.push(CARRY);
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(MOVE);
            }

            if (energy % 200 >= 50) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning)[0];
            name = spawnToUse.createCreep(body, undefined, {role: "collector", home: id});

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new collector " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, creepTasks) => {
            var tasks;

            // Check for unfilled collectors.
            tasks = TaskFillEnergy.getFillCollectorTasks(room);
            if (tasks.length > 0) {
                console.log("    Unfilled collectors: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("collector", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + c.carry[RESOURCE_ENERGY];}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), task.object), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Extension");
                            energyMissing -= creep.carry[RESOURCE_ENERGY];
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Attempt to assign harvest task to remaining creeps.
            _.forEach(_.filter(Cache.creepsInRoom("collector", room), (c) => !c.memory.currentTask), (creep) => {
                task = new TaskHarvest();
                if (task.canAssign(creep, creepTasks)) {
                    creep.say("Harvesting");
                }
            });
        }
    };

module.exports = Collector;
