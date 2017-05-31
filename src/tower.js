var Cache = require("cache");

//  #####                             
//    #                               
//    #     ###   #   #   ###   # ##  
//    #    #   #  #   #  #   #  ##  # 
//    #    #   #  # # #  #####  #     
//    #    #   #  # # #  #      #     
//    #     ###    # #    ###   #     
/**
 * Represents a tower.
 */
class Tower {
    //                      #                ###                #            
    //                                        #                 #            
    //  ###   ###    ###   ##     ###  ###    #     ###   ###   # #    ###   
    // #  #  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##     
    // # ##    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##   
    //  # #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###    
    //                            ###                                        
    /**
     * Assigns tasks to the tower.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     */
    static assignTasks(engine) {
        var tasks = engine.tasks,
            room = engine.room,
            towers = Cache.towersInRoom(room);

        // Find hostiles to attack.
        if (tasks.hostiles.length > 0) {
            _.forEach(towers, (tower) => {
                tower.attack(tasks.hostiles[0]);
            });
            return;
        }

        // Check for tower repairs.
        if (tasks.criticalRepairableStructures.length > 0) {
            _.forEach(towers, (tower) => {
                tower.repair(tasks.criticalRepairableStructures[0]);
            });
            return;
        }

        // Check for heals.
        if (tasks.hurtCreeps.length > 0) {
            _.forEach(towers, (tower) => {
                tower.heal(tasks.hurtCreeps[0]);
            });
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Tower, "Tower");
}
module.exports = Tower;
