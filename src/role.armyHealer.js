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
        var units = army.healer.units,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            boosts;

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
            body: body,
            boosts: boosts,
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
     */
    static assignTasks(army) {
        var creeps = Cache.creeps[army.name];

        // Assign tasks for escorts.
        Assign.escort(creeps && creeps.armyHealer || [], "Healing");

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
        var creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyHealer || []), (c) => !c.spawning && !c.memory.escorting);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If not yet boosted, go get boosts.
        Assign.getBoost(creepsWithNoTask, "Boosting");
        
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
        var creeps = Cache.creeps[army.name],
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
     */
    static assignDismantleTasks(army) {
        var creeps = Cache.creeps[army.name],
            healerCreeps = creeps && creeps.armyHealer || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healerCreeps), (c) => !c.spawning && !c.memory.escorting),
            dismantle;

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
        if (Game.rooms[attackRoomName] && (dismantle = army.dismantle).length > 0) {
            Assign.moveToPos(creepsWithNoTask, dismantle[0].pos, 3, "Attacking");

            _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
            if (creepsWithNoTask.length === 0) {
                return;
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
     */
    static assignAttackTasks(army) {
        var creeps = Cache.creeps[army.name],
            healerCreeps = creeps && creeps.armyHealer || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healerCreeps), (c) => !c.spawning && !c.memory.escorting),
            attackRoom, restPosition;

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
        if (attackRoom = Game.rooms[attackRoomName]) {
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
    require("screeps-profiler").registerObject(RoleArmyHealer, "RoleArmyHealer");
}
module.exports = RoleArmyHealer;
