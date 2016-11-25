var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskDismantle = require("task.dismantle"),
    TaskRally = require("task.rally"),

    Dismantler = {
        checkSpawn: (army) => {
            "use strict";

            var count = _.filter(Cache.creepsInArmy("armyDismantler", army), (c) => c.spawning || c.ticksToLive > 300).length, max = Memory.army[army].dismantler.maxCreeps;

            if (count < max) {
                Dismantler.spawn(army);
            }

            // Output dismantler count in the report.
            if (max > 0) {
                Cache.log.army[army].creeps.push({
                    role: "armyDismantler",
                    count: count,
                    max: max
                });
            }        
        },
        
        spawn: (army) => {
            "use strict";

            var body = [],
                count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Create the body of the army.
            for (count = 0; count < Memory.army[army].dismantler.units; count++) {
                body.push(WORK);
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, undefined, {role: "armyDismantler", army: army});
            Cache.spawning[spawnToUse.id] = true;

            return typeof name !== "number";
        },

        assignTasks: (army, directive, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInArmy("armyDismantler", army)), (c) => !c.spawning),
                assigned = [],
                task, structures, structure;

            if (creepsWithNoTask.length === 0) {
                return;
            }

            switch (directive) {
                case "building":
                    // Rally to army's building location.
                    task = new TaskRally(Memory.army[army].buildRoom);
                    _.forEach(creepsWithNoTask, (creep) => {
                        creep.say("Building");
                        task.canAssign(creep);
                    });
                    break;
                case "staging":
                    // Rally to army's staging location.
                    task = new TaskRally(Memory.army[army].stageRoom);
                    _.forEach(creepsWithNoTask, (creep) => {
                        creep.say("Staging");
                        task.canAssign(creep);
                    });
                    break;
                case "dismantle":
                    // Return to army's staging location if missing 1000 hits.
                    if (Memory.army[army].stageRoom !== Memory.army[army].attackRoom) {
                        task = new TaskRally(Memory.army[army].stageRoom);
                        _.forEach(_.filter(creepsWithNoTask, (c) => (c.room.name === Memory.army[army].attackRoom || c.pos.x <=1 || c.pos.x >=48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hitsMax - c.hits >= 1000), (creep) => {
                            creep.say("Ouch!");
                            task.canAssign(creep);
                            assigned.push(creep.name);
                        });

                        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                        assigned = [];

                        if (creepsWithNoTask.length === 0) {
                            return;
                        }
                    }

                    // Remove any creeps that need healing.
                    _.remove(creepsWithNoTask, (c) => c.hitsMax - c.hits >= 1000);

                    // Dismantle a dismantle location if it can be seen.
                    if (Game.rooms[Memory.army[army].attackRoom] && Memory.army[army].dismantle.length > 0) {
                        task = new TaskDismantle(Memory.army[army].dismantle[0]);
                        _.forEach(creepsWithNoTask, (creep) => {
                            if (task.canAssign(creep)) {
                                creep.say("Dismantle");
                                assigned.push(creep.name);
                            }
                        });

                        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                        assigned = [];

                        if (creepsWithNoTask.length === 0) {
                            return;
                        }
                    }

                    // Rally to army's attack location.
                    task = new TaskRally(Memory.army[army].attackRoom);
                    _.forEach(creepsWithNoTask, (creep) => {
                        task.canAssign(creep);
                    });
                    break;
                case "attack":
                    // Return to army's staging location if missing 1000 hits.
                    if (Memory.army[army].stageRoom !== Memory.army[army].attackRoom) {
                        task = new TaskRally(Memory.army[army].stageRoom);
                        _.forEach(_.filter(creepsWithNoTask, (c) => (c.room.name === Memory.army[army].attackRoom || c.pos.x <=1 || c.pos.x >=48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hitsMax - c.hits >= 1000), (creep) => {
                            creep.say("Ouch!");
                            task.canAssign(creep);
                            assigned.push(creep.name);
                        });

                        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                        assigned = [];

                        if (creepsWithNoTask.length === 0) {
                            return;
                        }
                    }

                    // Remove any creeps that need healing.
                    _.remove(creepsWithNoTask, (c) => c.hitsMax - c.hits >= 1000);

                    if (Game.rooms[Memory.army[army].attackRoom]) {
                        structures = _.sortBy(_.filter(Game.rooms[Memory.army[army].attackRoom].find(FIND_HOSTILE_STRUCTURES), (s) => !(s instanceof StructureController) && !(s instanceof StructureRampart)), (s) => (s instanceof StructureTower ? 1 : (s instanceof StructureSpawn ? 2 : 3)));

                        // Dismantle towers, spawns, and any remaining structures.
                        if (structures.length > 0) {
                            task = new TaskDismantle(structures[0].id);
                            _.forEach(creepsWithNoTask, (creep) => {
                                if (task.canAssign(creep)) {
                                    creep.say("Dismantle");
                                    assigned.push(creep.name);
                                }
                            });

                            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                            assigned = [];

                            if (creepsWithNoTask.length === 0) {
                                return;
                            }
                        }
                    }

                    // Rally to any hostile construction sites.
                    _.forEach(tasks.rally.tasks, (task) => {
                        _.forEach(creepsWithNoTask, (creep) => {
                            task.canAssign(creep);
                            assigned.push(creep.name);
                            return false;
                        });

                        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                        assigned = [];

                        if (creepsWithNoTask.length === 0) {
                            return;
                        }
                    });

                    // Rally to army's attack location.
                    task = new TaskRally(Memory.army[army].attackRoom);
                    _.forEach(creepsWithNoTask, (creep) => {
                        task.canAssign(creep);
                    });

                    break;
            }
        }
    };

require("screeps-profiler").registerObject(Dismantler, "ArmyDismantler");
module.exports = Dismantler;
