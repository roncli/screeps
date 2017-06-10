const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##             #                         #   #                 ##
//  #   #           #            # #                        #   #                  #
//  #   #   ###     #     ###   #   #  # ##   ## #   #   #  #   #   ###    ###     #     ###   # ##
//  ####   #   #    #    #   #  #   #  ##  #  # # #  #   #  #####  #   #      #    #    #   #  ##  #
//  # #    #   #    #    #####  #####  #      # # #  #  ##  #   #  #####   ####    #    #####  #
//  #  #   #   #    #    #      #   #  #      # # #   ## #  #   #  #      #   #    #    #      #
//  #   #   ###    ###    ###   #   #  #      #   #      #  #   #   ###    ####   ###    ###   #
//                                                   #   #
//                                                    ###
/**
 * Represents the healer role in the army.
 */
class RoleArmyHealer {
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
        const {healer: {units}} = army,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH];
        let boosts;

        body.push(...Array(units - 1).fill(HEAL));
        body.push(...Array(army.super ? 10 : units + 5).fill(MOVE));
        body.push(HEAL);

        if (army.boostRoom) {
            boosts = {};
            boosts[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] = 5;
            boosts[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] = units;
            if (army.super) {
                boosts[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] = 10;
            }
        }

        return {
            body,
            boosts,
            name: "armyHealer"
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
            armyHealers = creeps && creeps.armyHealer || [];

        // If not yet boosted, go get boosts.
        Assign.getBoost(_.filter(armyHealers, (c) => !c.spawning), "Boosting");

        // Assign tasks for escorts.
        Assign.escort(_.filter(armyHealers, (c) => !c.memory.labs || c.memory.labs.length === 0), "Healing");

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
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyHealer || []), (c) => !c.spawning && !c.memory.escorting);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Heal creeps in the army.
        Assign.heal(creepsWithNoTask, _.filter(creeps && creeps.all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");

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
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyHealer || []), (c) => !c.spawning && !c.memory.escorting);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Heal creeps in the army.
        Assign.heal(creepsWithNoTask, _.filter(creeps && creeps.all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");

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
            healerCreeps = creeps && creeps.armyHealer || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healerCreeps), (c) => !c.spawning && !c.memory.escorting);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Return to army's staging location if under 80% health.
        Assign.retreatArmyUnit(healerCreeps, healerCreeps, army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Heal creeps in the army.
        Assign.heal(creepsWithNoTask, _.filter(creeps && creeps.all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to near dismantle location.
        if (Game.rooms[attackRoomName] && army.dismantle.length > 0) {
            const {dismantle: {0: id}} = army,
                obj = Game.getObjectById(id);

            // TODO: This is broke.  Fix.
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
            healerCreeps = creeps && creeps.armyHealer || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healerCreeps), (c) => !c.spawning && !c.memory.escorting);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Return to army's staging location if under 80% health.
        Assign.retreatArmyUnit(healerCreeps, healerCreeps, army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Heal creeps in the army.
        Assign.heal(creepsWithNoTask, _.filter(creeps && creeps.all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Heal creeps in the room.
        const {rooms: {[attackRoomName]: attackRoom}} = Game;

        if (attackRoom) {
            Assign.heal(creepsWithNoTask, _.filter(attackRoom.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");

            _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
            if (creepsWithNoTask.length === 0) {
                return;
            }
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
    require("screeps-profiler").registerObject(RoleArmyHealer, "RoleArmyHealer");
}
module.exports = RoleArmyHealer;
