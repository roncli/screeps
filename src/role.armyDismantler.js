var Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##             #                         ####     #                                 #      ##                 
//  #   #           #            # #                         #  #                                      #       #                 
//  #   #   ###     #     ###   #   #  # ##   ## #   #   #   #  #   ##     ###   ## #    ###   # ##   ####     #     ###   # ##  
//  ####   #   #    #    #   #  #   #  ##  #  # # #  #   #   #  #    #    #      # # #      #  ##  #   #       #    #   #  ##  # 
//  # #    #   #    #    #####  #####  #      # # #  #  ##   #  #    #     ###   # # #   ####  #   #   #       #    #####  #     
//  #  #   #   #    #    #      #   #  #      # # #   ## #   #  #    #        #  # # #  #   #  #   #   #  #    #    #      #     
//  #   #   ###    ###    ###   #   #  #      #   #      #  ####    ###   ####   #   #   ####  #   #    ##    ###    ###   #     
//                                                   #   #                                                                       
//                                                    ###                                                                        
/**
 * Represents the dismantler role in the army.
 */
class RoleArmyDismantler {
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
     */
    static assignTasks(army) {
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
     */
    static assignBuildingTasks(army) {
        var creeps = creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyDismantler || []), (c) => !c.spawning);

        // If not yet boosted, go get boosts.
        Assign.getBoost(creepsWithNoTask, "Boosting");
        
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
     */
    static assignStagingTasks(army) {
        var creeps = creeps = Cache.creeps[army.name];

        // Rally to army's staging location.
        Assign.moveToRoom(_.filter(Utilities.creepsWithNoTask(creeps && creeps.armyDismantler || []), (c) => !c.spawning), army.stageRoom, "Staging");
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
     */
    static assignDismantleTasks(army) {
        var armyName = army.name,
            creeps = Cache.creeps[armyName],
            dismantlerCreeps = creeps && creeps.armyDismantler || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(dismantlerCreeps), (c) => !c.spawning);

        // Run to a healer, or return to army's staging location if under 80% health.
        Assign.retreatArmyUnitOrMoveToHealer(dismantlerCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Dismantle a target if it can be seen.
        Assign.dismantleArmyTarget(creepsWithNoTask, attackRoomName, army.dismantle, "Dismantle");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
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
     */
    static assignAttackTasks(army) {
        var armyName = army.name,
            creeps = Cache.creeps[armyName],
            dismantlerCreeps = creeps && creeps.armyDismantler || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(dismantlerCreeps), (c) => !c.spawning),
            restPosition;

        // Return to army's staging location if under 80% health.
        Assign.retreatArmyUnit(dismantlerCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        
        // Dismantle towers, spawns, and any remaining structures.
        Assign.dismantleHostileStructures(creepsWithNoTask, attackRoomName, "Dismantle");

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

        if (restPosition = army.restPosition) {
            // Rally to army's rest position.
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), undefined, "Attacking");
        } else {
            // Rally to army's attack location.
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleArmyDismantler, "RoleArmyDismantler");
}
module.exports = RoleArmyDismantler;
