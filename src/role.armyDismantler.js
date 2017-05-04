var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskDismantle = require("task.dismantle"),
    TaskRally = require("task.rally");

class Dismantler {
    static spawnSettings(army) {
        var units = army.dismantler.units,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            boosts;

        body.push(...Array(units).fill(WORK));
        body.push(...Array(units + 5).fill(MOVE));

        if (army.boostRoom) {
            boosts = {
                RESOURCE_CATALYZED_GHODIUM_ALKALIDE: 5,
                RESOURCE_CATALYZED_ZYNTHIUM_ACID: units
            }
        }

        return {
            body: body,
            boosts: boosts,
            name: "armyDismantler"
        };
    }

    static assignTasks(army, tasks) {
        var armyName = army.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[armyName] && Cache.creeps[armyName].armyDismantler || []), (c) => !c.spawning),
            stageRoomName = army.stageRoom,
            attackRoomName = army.attackRoom,
            attackRoom = Game.rooms[attackRoomName],
            buildRoomName = army.buildRoom,
            dismantle = army.dismantle,
            restPosition = army.restPosition,
            assigned = [],
            task, structures, healers;

        switch (army.directive) {
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
                task = new TaskRally(buildRoomName);
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
                        task = new TaskRally(buildRoomName);
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
                if (attackRoom && dismantle && dismantle.length > 0) {
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
                if (restPosition) {
                    task = new TaskRally(new RoomPosition(restPosition.x, restPosition.y, restPosition.room));
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
