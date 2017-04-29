var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskDismantle = require("task.dismantle"),
    TaskRally = require("task.rally");

class Dismantler {
    static checkSpawn(armyName, portals) {
        var count = _.filter(Cache.creeps[armyName] && Cache.creeps[armyName].armyDismantler || [], (c) => c.spawning || c.ticksToLive > 300).length,
            max = Memory.army[armyName].dismantler.maxCreeps;

        if (count < max) {
            Dismantler.spawn(armyName, portals);
        }

        // Output dismantler count in the report.
        if (Memory.log && max > 0 && Cache.log.army[armyName]) {
            Cache.log.army[armyName].creeps.push({
                role: "armyDismantler",
                count: count,
                max: max
            });
        }        
    }

    static spawn(armyName, portals) {
        var army = Memory.army[armyName],
            dismantlerUnits = army.dismantler.units,
            body = [],
            boostRoom, labsInUse, count, spawnToUse, name, labsToBoostWith;

        if (army.boostRoom) {
            boostRoom = Game.rooms[army.boostRoom];
            labsInUse = boostRoom.memory.labsInUse;
        }

        // Fail if all the spawns are busy.
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Create the body of the army.
        for (count = 0; count < 5; count++) {
            body.push(TOUGH);
        }
        
        for (count = 0; count < dismantlerUnits; count++) {
            body.push(WORK);
        }

        for (count = 0; count < dismantlerUnits + 5; count++) {
            body.push(MOVE);
        }

        if (boostRoom && !(labsToBoostWith = Utilities.getLabToBoostWith(boostRoom, 2))) {
            return false;
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === army.region)[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `armyDismantler-${armyName}-${Game.time.toFixed(0).substring(4)}`, {role: "armyDismantler", army: armyName, labs: boostRoom ? _.map(labsToBoostWith, (l) => l.id) : [], portals: portals});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        if (typeof name !== "number" && boostRoom) {
            // Set the labs to be in use.
            labsToBoostWith[0].creepToBoost = name;
            labsToBoostWith[0].resource = RESOURCE_CATALYZED_GHODIUM_ALKALIDE;
            labsToBoostWith[0].amount = 30 * 5;
            labsInUse.push(labsToBoostWith[0]);

            labsToBoostWith[1].creepToBoost = name;
            labsToBoostWith[1].resource = RESOURCE_CATALYZED_ZYNTHIUM_ACID;
            labsToBoostWith[1].amount = 30 * dismantlerUnits;
            labsInUse.push(labsToBoostWith[1]);

            // If anything is coming to fill the labs, stop them.
            if (Cache.creeps[boostRoom.name]) {
                _.forEach(_.filter(Cache.creeps[boostRoom.name].all, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && _.map(labsToBoostWith, (l) => l.id).indexOf(c.memory.currentTask.id) !== -1), (creep) => {
                    delete creep.memory.currentTask;
                });
            }
        }

        return typeof name !== "number";
    }

    static assignTasks(armyName, directive, tasks) {
        var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[armyName] && Cache.creeps[armyName].armyDismantler || []), (c) => !c.spawning),
            assigned = [],
            army = Memory.army[armyName],
            stageRoomName = army.stageRoom,
            attackRoomName = army.attackRoom,
            attackRoom = Game.rooms[attackRoomName],
            dismantle = army.dismantle,
            task, structures, healers;

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
                task = new TaskRally(army.buildRoom);
                _.forEach(creepsWithNoTask, (creep) => {
                    creep.say("Building");
                    if (creep.memory.portaling && creep.memory.portals[0] !== creep.room.name) {
                        creep.memory.portals.shift();
                    }
                    if (creep.memory.portals && creep.memory.portals.length > 0) {
                        if (creep.memory.portals[0] === creep.room.name) {
                            creep.memory.portaling = true;
                            task = new TaskRally(Cache.portalsInRoom(creep.room)[0].id);
                        } else {
                            task = new TaskRally(creep.memory.portals[0]);
                        }
                    } else {
                        task = new TaskRally(army.buildRoom);
                    }
                    task.canAssign(creep);
                });
                break;
            case "staging":
                // Rally to army's staging location.
                task = new TaskRally(stageRoomName);
                _.forEach(creepsWithNoTask, (creep) => {
                    creep.say("Staging");
                    task.canAssign(creep);
                });
                break;
            case "dismantle":
                // Return to army's staging location if missing 1000 hits.
                healers = Cache.creeps[armyName].armyHealer || [];
                if (healers.length > 0 && stageRoomName !== attackRoomName) {
                    task = new TaskRally(stageRoomName);
                    task.range = 22;
                    _.forEach(_.filter(Cache.creeps[armyName].armyDismantler, (c) => (c.room.name === attackRoomName || c.pos.x <=1 || c.pos.x >=48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hitsMax - c.hits >= 1000), (creep) => {
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

                // If we're more than 2 units from the closest healer, run towards it.
                if (healers.length > 0) {
                    _.forEach(creepsWithNoTask, (creep) => {
                        var closest = Utilities.objectsClosestToObj(healers, creep),
                            task;

                        if (closest[0].pos.getRangeTo(creep) > 2) {
                            task = new TaskRally(closest[0].id);
                            task.canAssign(creep);
                            assigned.push(creep.name);
                        }
                    });

                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];

                    if (creepsWithNoTask.length === 0) {
                        return;
                    }
                }
                
                // Remove any creeps that need healing.
                if (healers.length > 0) {
                    _.remove(creepsWithNoTask, (c) => c.hitsMax - c.hits >= 1000);
                }

                // Dismantle a dismantle location if it can be seen.
                if (attackRoom && dismantle.length > 0) {
                    task = new TaskDismantle(dismantle[0]);
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
                task = new TaskRally(attackRoomName);
                _.forEach(creepsWithNoTask, (creep) => {
                    task.canAssign(creep);
                });
                break;
            case "attack":
                // Return to army's staging location if missing 1000 hits.
                healers = Cache.creeps[armyName].armyHealer || [];
                if (healers.length > 0 && stageRoomName !== attackRoomName) {
                    task = new TaskRally(stageRoomName);
                    task.range = 22;
                    _.forEach(_.filter(Cache.creeps[armyName].armyDismantler, (c) => (c.room.name === attackRoomName || c.pos.x <=1 || c.pos.x >=48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hitsMax - c.hits >= 1000), (creep) => {
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
                if (healers.length > 0) {
                    _.remove(creepsWithNoTask, (c) => c.hitsMax - c.hits >= 1000);
                }

                if (attackRoom) {
                    structures = _.filter(attackRoom.find(FIND_HOSTILE_STRUCTURES), (s) => !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_KEEPER_LAIR));

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
                if (army.restPosition) {
                    task = new TaskRally(new RoomPosition(army.restPosition.x, army.restPosition.y, army.restPosition.room));
                } else {
                    task = new TaskRally(attackRoomName);
                }
                _.forEach(creepsWithNoTask, (creep) => {
                    task.canAssign(creep);
                });

                break;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Dismantler, "ArmyDismantler");
}
module.exports = Dismantler;
