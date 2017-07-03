const Cache = require("cache");

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
     * @return {void}
     */
    static assignTasks(engine) {
        const {tasks, room} = engine,
            towers = Cache.towersInRoom(room);

        // Don't do anything unless all towers have energy.
        if (_.filter(towers, (t) => t.energy === 0).length > 0) {
            return;
        }

        // Find hostiles to attack.
        if (tasks.hostiles.length > 0 && _.filter(towers, (t) => t.energy < 500).length === 0) {
            _.forEach(towers, (tower) => {
                tower.attack(tasks.hostiles[0]);
            });

            return;
        }

        // Check for tower repairs.
        const towerRepairableStructures = _.filter(tasks.criticalRepairableStructures, (s) => s.hits < 10000);

        if (towerRepairableStructures.length > 0) {
            _.forEach(towers, (tower) => {
                tower.repair(towerRepairableStructures[0]);
            });

            return;
        }

        // Check for heals.
        if (tasks.hurtCreeps.length > 0) {
            _.forEach(towers, (tower) => {
                tower.heal(tasks.hurtCreeps[0]);
            });
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Tower, "Tower");
}
module.exports = Tower;
