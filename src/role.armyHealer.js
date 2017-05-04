var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally");

class Healer {
    static spawnSettings(army) {
        var units = army.healer.units,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            boosts;

        body.push(...Array(units - 1).fill(HEAL));
        body.push(...Array(units + 5).fill(MOVE));
        body.push(HEAL);

        if (army.boostRoom) {
            boosts = {
                RESOURCE_CATALYZED_GHODIUM_ALKALIDE: 5,
                RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE: units
            };
        }

        return {
            body: body,
            boosts: boosts,
            name: "armyHealer"
        };
    }

    static assignTasks(army, tasks) {
        var armyName = army.name,
            stageRoomName = army.stageRoom,
            attackRoomName = army.attackRoom,
            attackRoom = Game.rooms[attackRoomName],
            buildRoomName = army.buildRoom,
            dismantle = army.dismantle,
            restPosition = army.restPosition,
            assigned = [],
            creepsWithNoTask, task;

        // Assign tasks for escorts.
        _.forEach(_.filter(Cache.creeps[armyName] && Cache.creeps[armyName].armyHealer || [], (c) => !c.spawning && c.memory.escorting), (creep) => {
            // If the escortee is dead, this creep is no longer escorting anyone.
            if (!Game.getObjectById(creep.memory.escorting)) {
                delete creep.memory.escorting;
                return;
            }
            
            // Heal the escortee if under 1000 damage, rally to it otherwise.
            if (creep.hitsMax - creep.hits < 1000 && !new TaskHeal(creep.memory.escorting).canAssign(creep)) {
                new TaskRally(creep.memory.escorting).canAssign(creep);
            }
        });

        creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[armyName] && Cache.creeps[armyName].armyHealer || []), (c) => !c.spawning && !c.memory.escorting);

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
                if (stageRoomName !== attackRoomName) {
                    task = new TaskRally(stageRoomName);
                    task.range = 22;
                    _.forEach(_.filter(Cache.creeps[armyName].armyHealer, (c) => (c.room.name === attackRoomName || c.pos.x <=1 || c.pos.x >=48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hitsMax - c.hits >= 1000), (creep) => {
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

                // Heal hurt creeps.
                _.forEach(tasks.heal.tasks, (task) => {
                    _.forEach(creepsWithNoTask, (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Heal");
                            assigned.push(creep.name);
                        }
                    });

                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];

                    if (creepsWithNoTask.length === 0) {
                        return;
                    }
                });

                // Rally to near dismantle location.
                if (attackRoom && dismantle.length > 0) {
                    task = new TaskRally(dismantle[0]);
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
                task = new TaskRally(attackRoomName);
                _.forEach(creepsWithNoTask, (creep) => {
                    task.canAssign(creep);
                });

                break;
            case "attack":
                // Return to army's staging location if missing 1000 hits.
                if (stageRoomName !== attackRoomName) {
                    task = new TaskRally(stageRoomName);
                    task.range = 22;
                    _.forEach(_.filter(Cache.creeps[armyName].armyHealer, (c) => (c.room.name === attackRoomName || c.pos.x <=1 || c.pos.x >=48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hitsMax - c.hits >= 1000), (creep) => {
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

                // Heal hurt creeps in the amry.
                _.forEach(tasks.heal.tasks, (task) => {
                    _.forEach(creepsWithNoTask, (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Heal");
                            assigned.push(creep.name);
                        }
                    });

                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];

                    if (creepsWithNoTask.length === 0) {
                        return;
                    }
                });

                // Heal hurt creeps in the room.
                
                if (attackRoom && !attackRoom.unobservable) {
                    _.forEach(TaskHeal.getTasks(attackRoom), (task) => {
                        _.forEach(creepsWithNoTask, (creep) => {
                            if (task.canAssign(creep)) {
                                creep.say("Heal");
                                assigned.push(creep.name);
                            }
                        });

                        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                        assigned = [];

                        if (creepsWithNoTask.length === 0) {
                            return;
                        }
                    });
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
    require("screeps-profiler").registerObject(Healer, "ArmyHealer");
}
module.exports = Healer;
