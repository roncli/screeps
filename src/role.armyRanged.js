const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##             #                         ####                                   #
//  #   #           #            # #                        #   #                                  #
//  #   #   ###     #     ###   #   #  # ##   ## #   #   #  #   #   ###   # ##    ## #   ###    ## #
//  ####   #   #    #    #   #  #   #  ##  #  # # #  #   #  ####       #  ##  #  #  #   #   #  #  ##
//  # #    #   #    #    #####  #####  #      # # #  #  ##  # #     ####  #   #   ##    #####  #   #
//  #  #   #   #    #    #      #   #  #      # # #   ## #  #  #   #   #  #   #  #      #      #  ##
//  #   #   ###    ###    ###   #   #  #      #   #      #  #   #   ####  #   #   ###    ###    ## #
//                                                   #   #                       #   #
//                                                    ###                         ###
/**
 * Represents the ranged role in the army.
 */
class RoleArmyRanged {
    //                                 ##          #     #     #
    //                                #  #         #     #
    //  ###   ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###
    // ##     #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##
    //   ##   #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##
    // ###    ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###
    //        #                                                            ###
    /**
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(army) {
        const {ranged: {units, tough}} = army,
            body = army.super ? [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH] : [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            moveUnits = army.super ? 10 : units + 5;
        let boosts;

        if (tough) {
            for (let count = 0; count < tough; count++) {
                body.push(TOUGH);
            }
        }

        for (let count = 0; count < units; count++) {
            body.push(RANGED_ATTACK);
        }
        for (let count = 0; count < moveUnits; count++) {
            body.push(MOVE);
        }

        if (army.boostRoom) {
            boosts = {};
            boosts[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] = army.super ? 10 : 5;
            boosts[RESOURCE_CATALYZED_KEANIUM_ALKALIDE] = units;
            if (army.super) {
                boosts[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] = 10;
            }
        }

        return {
            body,
            boosts,
            name: "armyRanged"
        };
    }

    //                      #                ###                #
    //                                        #                 #
    //  ###   ###    ###   ##     ###  ###    #     ###   ###   # #    ###
    // #  #  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##
    // # ##    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##
    //  # #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###
    //                            ###
    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            armyRanged = creeps && creeps.armyRanged || [];

        // If not yet boosted, go get boosts.
        Assign.getBoost(_.filter(armyRanged, (c) => !c.spawning), "Boosting");

        switch (army.directive) {
            case "building":
                this.assignBuildingTasks(army);
                break;
            case "staging":
                this.assignStagingTasks(army);
                break;
            case "dismantle":
                this.assignDismantleTasks(army);
                break;
            case "attack":
                this.assignAttackTasks(army);
                break;
        }
    }

    //                      #                ###          #    ##       #   #                ###                #
    //                                       #  #               #       #                     #                 #
    //  ###   ###    ###   ##     ###  ###   ###   #  #  ##     #     ###  ##    ###    ###   #     ###   ###   # #    ###
    // #  #  ##     ##      #    #  #  #  #  #  #  #  #   #     #    #  #   #    #  #  #  #   #    #  #  ##     ##    ##
    // # ##    ##     ##    #     ##   #  #  #  #  #  #   #     #    #  #   #    #  #   ##    #    # ##    ##   # #     ##
    //  # #  ###    ###    ###   #     #  #  ###    ###  ###   ###    ###  ###   #  #  #      #     # #  ###    #  #  ###
    //                            ###                                                   ###
    /**
     * Assignments for the building directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignBuildingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            armyRanged = creeps && creeps.armyRanged || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(armyRanged), (c) => !c.spawning && (!c.memory.labs || c.memory.labs.length === 0) && (!c.memory.currentTask || c.memory.currentTask.priority !== Game.time));

        // Assign tasks for escortees.
        Assign.findEscort(_.filter(armyRanged, (c) => !c.memory.labs || c.memory.labs.length === 0), "Escort!");

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attack hostile units.
        Assign.rangedAttack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to army's building location.
        Assign.moveToRoom(creepsWithNoTask, army.buildRoom, "Building");
    }

    //                      #                 ##    #                 #                ###                #
    //                                       #  #   #                                   #                 #
    //  ###   ###    ###   ##     ###  ###    #    ###    ###   ###  ##    ###    ###   #     ###   ###   # #    ###
    // #  #  ##     ##      #    #  #  #  #    #    #    #  #  #  #   #    #  #  #  #   #    #  #  ##     ##    ##
    // # ##    ##     ##    #     ##   #  #  #  #   #    # ##   ##    #    #  #   ##    #    # ##    ##   # #     ##
    //  # #  ###    ###    ###   #     #  #   ##     ##   # #  #     ###   #  #  #      #     # #  ###    #  #  ###
    //                            ###                           ###               ###
    /**
     * Assignments for the staging directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignStagingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyRanged || []), (c) => !c.spawning && (!c.memory.currentTask || c.memory.currentTask.priority !== Game.time));

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attack hostile units.
        Assign.rangedAttack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to army's staging location.
        Assign.moveToRoom(creepsWithNoTask, army.stageRoom, "Staging");
    }

    //                      #                ###    #                              #    ##          ###                #
    //                                       #  #                                  #     #           #                 #
    //  ###   ###    ###   ##     ###  ###   #  #  ##     ###   # #    ###  ###   ###    #     ##    #     ###   ###   # #    ###
    // #  #  ##     ##      #    #  #  #  #  #  #   #    ##     ####  #  #  #  #   #     #    # ##   #    #  #  ##     ##    ##
    // # ##    ##     ##    #     ##   #  #  #  #   #      ##   #  #  # ##  #  #   #     #    ##     #    # ##    ##   # #     ##
    //  # #  ###    ###    ###   #     #  #  ###   ###   ###    #  #   # #  #  #    ##  ###    ##    #     # #  ###    #  #  ###
    //                            ###
    /**
     * Assignments for the dismantle directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignDismantleTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            rangedCreeps = creeps && creeps.armyRanged || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(rangedCreeps), (c) => !c.spawning && (!c.memory.currentTask || c.memory.currentTask.priority !== Game.time));

        // Run to a healer, or return to army's staging location if under 80% health.
        Assign.retreatArmyUnit(rangedCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.9, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attack hostile units.
        Assign.rangedAttack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to near dismantle location.
        const {dismantle} = army;

        if (Game.rooms[attackRoomName] && dismantle.length > 0) {
            const {0: id} = dismantle,
                obj = Game.getObjectById(id);

            if (obj) {
                Assign.moveToPos(creepsWithNoTask, obj.pos, 3, "Attacking");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }
            }
        }

        // Rally to army's attack location.
        Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
    }

    //                      #                 ##    #     #                #     ###                #
    //                                       #  #   #     #                #      #                 #
    //  ###   ###    ###   ##     ###  ###   #  #  ###   ###    ###   ##   # #    #     ###   ###   # #    ###
    // #  #  ##     ##      #    #  #  #  #  ####   #     #    #  #  #     ##     #    #  #  ##     ##    ##
    // # ##    ##     ##    #     ##   #  #  #  #   #     #    # ##  #     # #    #    # ##    ##   # #     ##
    //  # #  ###    ###    ###   #     #  #  #  #    ##    ##   # #   ##   #  #   #     # #  ###    #  #  ###
    //                            ###
    /**
     * Assignments for the attack directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignAttackTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            rangedCreeps = creeps && creeps.armyRanged || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(rangedCreeps), (c) => !c.spawning && (!c.memory.currentTask || c.memory.currentTask.priority !== Game.time));

        // Return to army's staging location if under 80% health.
        Assign.retreatArmyUnit(rangedCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.9, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attack hostile units.
        Assign.rangedAttack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Stomp construction sites.
        Assign.stomp(creepsWithNoTask, army.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        const {restPosition} = army;

        if (restPosition) {
            // Rally to army's rest position.
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), void 0, "Attacking");
        } else {
            // Rally to army's attack location.
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleArmyRanged, "RoleArmyRanged");
}
module.exports = RoleArmyRanged;
