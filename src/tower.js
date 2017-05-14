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
     * @param {RoomEngine} engine The room engine to get tasks from.
     * @param {object} tasks The tasks to assign to the tower.
     */
    static assignTasks(engine, tasks) {
        var room = engine.room;

        // Find hostiles to attack.
        if (tasks.rangedAttack.tasks.length > 0) {
            _.forEach(Cache.towersInRoom(room), (tower) => {
                tower.attack(tasks.rangedAttack.tasks[0].enemy);
            });
            return;
        }

        // Check for tower repairs.
        if (tasks.repair.towerTasks.length > 0) {
            _.forEach(Cache.towersInRoom(room), (tower) => {
                tower.repair(tasks.repair.towerTasks[0].structure);
            });
            return;
        }

        // Check for heals.
        if (tasks.heal.tasks.length > 0) {
            _.forEach(Cache.towersInRoom(room), (tower) => {
                tower.heal(tasks.heal.tasks[0].ally);
            });
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Tower, "Tower");
}
module.exports = Tower;
