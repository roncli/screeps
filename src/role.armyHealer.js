var Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

/**
 * Represents the healer role in the army.
 */
class Healer {
    /**
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
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
            healers = Cache.creeps[armyName] && Cache.creeps[armyName].armyHealer || [],
            creepsToHeal = _.filter(Cache.creeps[armyName] && Cache.creeps[armyName].all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax),
            stageRoomName = army.stageRoom,
            attackRoomName = army.attackRoom,
            attackRoom = Game.rooms[attackRoomName],
            buildRoomName = army.buildRoom,
            dismantle = army.dismantle,
            restPosition = army.restPosition,
            assigned = [],
            creepsWithNoTask, task;

        // Assign tasks for escorts.
        Assign.escort(healers, "Healing");

        creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healers), (c) => !c.spawning && !c.memory.escorting);

        switch (army.directive) {
            case "building":
                // If not yet boosted, go get boosts.
                Assign.getBoost(creepsWithNoTask, "Boosting");
                
                _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                if (creepsWithNoTask.length === 0) {
                    return;
                }
                
                // Heal creeps in the army.
                Assign.healCreeps(creepsWithNoTask, creepsToHeal, "Healing");
                
                _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Rally to army's building location.
                Assign.moveToRoom(creepsWithNoTask, buildRoomName, "Building");
                
                break;
            case "staging":
                // Heal creeps in the army.
                Assign.healCreeps(creepsWithNoTask, creepsToHeal, "Healing");
                
                _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Rally to army's staging location.
                Assign.moveToRoom(creepsWithNoTask, stageRoomName, "Staging");

                break;
            case "dismantle":
                // Return to army's staging location if under 80% health.
                Assign.retreatArmyUnit(healers, Cache.creeps[army.name].armyHealer, stageRoomName, attackRoomName, 0.8, "Ouch!");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Heal creeps in the army.
                Assign.healCreeps(creepsWithNoTask, creepsToHeal, "Healing");
                
                _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Rally to near dismantle location.
                if (attackRoom && dismantle.length > 0) {
                    Assign.moveToPos(creepsWithNoTask, dismantle[0].pos, 3, "Attacking");

                    _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                    if (creepsWithNoTask.length === 0) {
                        return;
                    }
                }

                // Rally to army's attack location.
                Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");

                break;
            case "attack":
                // Return to army's staging location if under 80% health.
                Assign.retreatArmyUnit(healers, Cache.creeps[army.name].armyHealer, stageRoomName, attackRoomName, 0.8, "Ouch!");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Heal creeps in the army.
                Assign.healCreeps(creepsWithNoTask, creepsToHeal, "Healing");
                
                _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Heal creeps in the room.
                if (attackRoom) {
                    Assign.healCreeps(creepsWithNoTask, _.filter(attackRoom.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");
                
                    _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                    if (creepsWithNoTask.length === 0) {
                        return;
                    }
                }

                // Rally to any hostile construction sites.
                Assign.tasks(creepsWithNoTask, tasks.rally.tasks, false, "Stomping");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask);
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                if (restPosition) {
                    // Rally to army's rest position.
                    Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), undefined, "Attacking");
                } else {
                    // Rally to army's attack location.
                    Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
                }

                break;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Healer, "ArmyHealer");
}
module.exports = Healer;
