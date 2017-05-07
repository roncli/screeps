var Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

/**
 * Represents the melee role in the army.
 */
class Melee {
    /**
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(army) {
        var units = army.melee.units,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            boosts;

        body.push(...Array(units).fill(ATTACK));
        body.push(...Array(units + 5).fill(MOVE));

        if (army.boostRoom) {
            boosts = {
                RESOURCE_CATALYZED_GHODIUM_ALKALIDE: 5,
                RESOURCE_CATALYZED_UTRIUM_ACID: units
            };
        }

        return {
            body: body,
            boosts: boosts,
            name: "armyMelee"
        };
    }

    static assignTasks(army, tasks) {
        var armyName = army.name,
            melees = Cache.creeps[armyName] && Cache.creeps[armyName].armyHealer || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(melees), (c) => !c.spawning),
            attackRoomName, dismantle, restPosition;

        switch (army.directive) {
            case "building":
                // If not yet boosted, go get boosts.
                Assign.getBoost(creepsWithNoTask, "Boosting");
                
                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Attack hostile units.
                Assign.attack(creepsWithNoTask, army.hostiles, "Attacking");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Rally to army's building location.
                Assign.moveToRoom(creepsWithNoTask, army.buildRoom, "Building");
                
                break;
            case "staging":
                // Attack hostile units.
                Assign.attack(creepsWithNoTask, army.hostiles, "Attacking");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Rally to army's staging location.
                Assign.moveToRoom(creepsWithNoTask, army.stageRoom, "Staging");

                break;
            case "dismantle":
                attackRoomName = army.attackRoom;

                // Run to a healer, or return to army's staging location if under 80% health.
                Assign.retreatArmyUnitOrMoveToHealer(melees, Cache.creeps[army.name].armyHealer, army.stageRoom, attackRoomName, 0.8, "Ouch!");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Attack hostile units.
                Assign.attack(creepsWithNoTask, army.hostiles, "Attacking");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Rally to near dismantle location.
                if (Game.rooms[attackRoomName] && (dismantle = army.dismantle).length > 0) {
                    Assign.moveToPos(creepsWithNoTask, dismantle[0].pos, 3, "Attacking");

                    _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                    if (creepsWithNoTask.length === 0) {
                        return;
                    }
                }

                // Rally to army's attack location.
                Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");

                break;
            case "attack":
                attackRoomName = army.attackRoom;

                // Return to army's staging location if under 80% health.
                Assign.retreatArmyUnit(melees, Cache.creeps[army.name].armyHealer, army.stageRoom, attackRoomName, 0.8, "Ouch!");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Attack hostile units.
                Assign.attack(creepsWithNoTask, army.hostiles, "Attacking");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Rally to any hostile construction sites.
                Assign.tasks(creepsWithNoTask, tasks.rally.tasks, false, "Stomping");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                if (restPosition = army.restPosition) {
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
    require("screeps-profiler").registerObject(Melee, "ArmyMelee");
}
module.exports = Melee;
