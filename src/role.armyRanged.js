var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),

    Ranged = {
        checkSpawn: (army) => {
            "use strict";

            var count = _.filter(Cache.creepsInArmy("armyRanged", army), (c) => c.spawning || c.ticksToLive > 300).length, max = Memory.army[army].ranged.maxCreeps;

            if (count < max) {
                Ranged.spawn(army);
            }

            // Output ranged attacker count in the report.
            if (max > 0) {
                Cache.log.army[army].creeps.push({
                    role: "armyRanged",
                    count: count,
                    max: max
                });
            }        
        },
        
        spawn: (army) => {
            "use strict";

            var body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Create the body of the army.
            for (count = 0; count < Memory.army[army].ranged.units; count++) {
                body.push(RANGED_ATTACK);
                body.push(MOVE);
            }

            if (Game.rooms[Memory.army[army].boostRoom] && !(labsToBoostWith = Utilities.getLabToBoostWith(Game.rooms[Memory.army[army].boostRoom], 1))) {
                return false;
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id])[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "armyRanged-" + army + "-" + Game.time.toFixed(0).substring(4), {role: "armyRanged", army: army, labs: Game.rooms[Memory.army[army].boostRoom] ? _.map(labsToBoostWith, (l) => l.id) : []});
            Cache.spawning[spawnToUse.id] = true;

            if (typeof name !== "number" && Game.rooms[Memory.army[army].boostRoom]) {
                // Set the labs to be in use.
                labsToBoostWith[0].creepToBoost = name;
                labsToBoostWith[0].resource = RESOURCE_CATALYZED_GHODIUM_ALKALIDE;
                labsToBoostWith[0].amount = 30 * 5;
                Game.rooms[Memory.army[army].boostRoom].memory.labsInUse.push(labsToBoostWith[0]);

                // If anything is coming to fill the labs, stop them.
                _.forEach(_.filter(Cache.creepsInRoom("all", Game.rooms[Memory.army[army].boostRoom]), (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && _.map(labsToBoostWith, (l) => l.id).indexOf(c.memory.currentTask.id) !== -1), (creep) => {
                    delete creep.memory.currentTask;
                });
            }

            return typeof name !== "number";
        },

        assignTasks: (army, directive, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInArmy("armyHealer", army)), (c) => !c.spawning),
                assigned = [],
                task, healers;

            if (creepsWithNoTask.length === 0) {
                return;
            }

            switch (directive) {
                case "building":
                    // If not yet boosted, go get boosts.
                    _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
                        var task = new TaskRally(creep.memory.labs[0]);
                        task.canAssign(creep);
                        assigned.push(creep.name);
                    });

                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];

                    if (creepsWithNoTask.length === 0) {
                        return;
                    }

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
                    // If we're more than 2 units from the closest healer, run towards it.
                    healers = Cache.creepsInArmy("healer", army);
                    if (healers.length > 0) {
                        _.forEach(creepsWithNoTask, (creep) => {
                            var closest = Utilities.objectsClosestToObj(healers, creep),
                                task;

                            if (closest[0].pos.getRangeTo(creep) > 2) {
                                task = new TaskRally(closest[0].id);
                                task.canAssign(creep);
                                assigned.push(creep.name);
                            }

                            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                            assigned = [];
                        });

                        if (creepsWithNoTask.length === 0) {
                            return;
                        }
                    }
                    
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

                    // Attack hostile units within 2 of the dismantle location.
                    _.forEach(tasks.ranged.tasks, (task) => {
                        _.forEach(creepsWithNoTask, (creep) => {
                            if (task.canAssign(creep)) {
                                creep.say("Die!", true);
                                assigned.push(creep.name);
                            }
                        });

                        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                        assigned = [];

                        if (creepsWithNoTask.length === 0) {
                            return false;
                        }
                    });
                    
                    if (creepsWithNoTask.length === 0) {
                        return;
                    }

                    // Rally to near dismantle location.
                    if (Game.rooms[Memory.army[army].attackRoom] && Memory.army[army].dismantle.length > 0) {
                        task = new TaskRally(Memory.army[army].dismantle[0]);
                        task.range = 3;
                        _.forEach(creepsWithNoTask, (creep) => {
                            task.canAssign(creep);
                            assigned.push(creep.name);
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

                    // Attack hostile units.
                    _.forEach(tasks.ranged.tasks, (task) => {
                        _.forEach(creepsWithNoTask, (creep) => {
                            if (task.canAssign(creep)) {
                                creep.say("Die!", true);
                                assigned.push(creep.name);
                            }
                        });

                        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                        assigned = [];

                        if (creepsWithNoTask.length === 0) {
                            return false;
                        }
                    });
                    
                    if (creepsWithNoTask.length === 0) {
                        return;
                    }

                    // Rally to army's attack location.
                    task = new TaskRally(Memory.army[army].attackRoom);
                    _.forEach(creepsWithNoTask, (creep) => {
                        task.canAssign(creep);
                    });

                    break;
            }
        }
    };

require("screeps-profiler").registerObject(Ranged, "ArmyRanged");
module.exports = Ranged;
