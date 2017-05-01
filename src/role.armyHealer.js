var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally");

class Healer {
    static checkSpawn(armyName) {
        var count = _.filter(Cache.creeps[armyName] && Cache.creeps[armyName].armyHealer || [], (c) => c.spawning || c.ticksToLive > 300).length,
            max = Memory.army[armyName].healer.maxCreeps;

        if (count < max) {
            Healer.spawn(armyName);
        }

        // Output healer count in the report.
        if (Memory.log && max > 0 && Cache.log.army[armyName]) {
            Cache.log.army[armyName].creeps.push({
                role: "armyHealer",
                count: count,
                max: max
            });
        }        
    }

    static spawn(armyName) {
        var army = Memory.army[armyName],
            healerUnits = army.healer.units,
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
        
        for (count = 0; count < healerUnits - 1; count++) {
            body.push(HEAL);
        }

        for (count = 0; count < healerUnits + 5; count++) {
            body.push(MOVE);
        }
        
        body.push(HEAL);

        if (boostRoom && !(labsToBoostWith = Utilities.getLabToBoostWith(boostRoom, 2))) {
            return false;
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === army.region)[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `armyHealer-${armyName}-${Game.time.toFixed(0).substring(4)}`, {role: "armyHealer", army: armyName, labs: boostRoom ? _.map(labsToBoostWith, (l) => l.id) : [], portals: army.portals});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        if (typeof name !== "number" && boostRoom) {
            // Set the labs to be in use.
            labsToBoostWith[0].creepToBoost = name;
            labsToBoostWith[0].resource = RESOURCE_CATALYZED_GHODIUM_ALKALIDE;
            labsToBoostWith[0].amount = 30 * 5;
            labsInUse.push(labsToBoostWith[0]);

            labsToBoostWith[1].creepToBoost = name;
            labsToBoostWith[1].resource = RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE;
            labsToBoostWith[1].amount = 30 * healerUnits;
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
        var assigned = [],
            army = Memory.army[armyName],
            stageRoomName = army.stageRoom,
            attackRoomName = army.attackRoom,
            dismantle = army.dismantle,
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
                if (Game.rooms[attackRoomName] && dismantle.length > 0) {
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
                
                if (Game.rooms[attackRoomName] && !Game.rooms[attackRoomName].unobservable) {
                    _.forEach(TaskHeal.getTasks(Game.rooms[attackRoomName]), (task) => {
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
    require("screeps-profiler").registerObject(Healer, "ArmyHealer");
}
module.exports = Healer;
