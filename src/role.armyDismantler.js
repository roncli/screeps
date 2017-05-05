var Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

/**
 * Represents the dismantler role in the army.
 */
class Dismantler {
    /**
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
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
            };
        }

        return {
            body: body,
            boosts: boosts,
            name: "armyDismantler"
        };
    }

    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     * @param {object} tasks The tasks to assign.
     */
    static assignTasks(army, tasks) {
        var armyName = army.name,
            dismantlers = Cache.creeps[armyName] && Cache.creeps[armyName].armyDismantler || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(dismantlers), (c) => !c.spawning),
            stageRoomName = army.stageRoom,
            attackRoomName = army.attackRoom,
            attackRoom = Game.rooms[attackRoomName],
            buildRoomName = army.buildRoom,
            dismantle = army.dismantle,
            restPosition = army.restPosition;

        switch (army.directive) {
            case "building":
                // If not yet boosted, go get boosts.
                Assign.getBoost(creepsWithNoTask, "Boosting");
                
                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Rally to army's building location.
                Assign.moveToRoom(creepsWithNoTask, buildRoomName, "Building");
                
                break;
            case "staging":
                // Rally to army's staging location.
                Assign.moveToRoom(creepsWithNoTask, stageRoomName, "Staging");

                break;
            case "dismantle":
                // Run to a healer, or return to army's staging location if under 80% health.
                Assign.retreatArmyUnitOrMoveToHealer(dismantlers, Cache.creeps[army.name].armyHealer, stageRoomName, attackRoomName, 0.8, "Ouch!");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }

                // Dismantle a target if it can be seen.
                Assign.dismantleArmyTarget(creepsWithNoTask, attackRoom, dismantle, "Dismantle");
                
                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }
                
                // Rally to army's attack location.
                Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
                
                break;
            case "attack":
                // Return to army's staging location if under 80% health.
                Assign.retreatArmyUnit(dismantlers, Cache.creeps[army.name].armyHealer, stageRoomName, attackRoomName, 0.8, "Ouch!");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }
                
                // Dismantle towers, spawns, and any remaining structures.
                Assign.dismantleHostileStructures(creepsWithNoTask, attackRoom, "Dismantle");

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
    require("screeps-profiler").registerObject(Dismantler, "ArmyDismantler");
}
module.exports = Dismantler;
