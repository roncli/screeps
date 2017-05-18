var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally");

//  ####           ##           #   #                 ##                 
//  #   #           #           #   #                  #                 
//  #   #   ###     #     ###   #   #   ###    ###     #     ###   # ##  
//  ####   #   #    #    #   #  #####  #   #      #    #    #   #  ##  # 
//  # #    #   #    #    #####  #   #  #####   ####    #    #####  #     
//  #  #   #   #    #    #      #   #  #      #   #    #    #      #     
//  #   #   ###    ###    ###   #   #   ###    ####   ###    ###   #     
/**
 * Represents the healer role.
 */
class RoleHealer {
    //       #                 #      ##                            ##          #     #     #                       
    //       #                 #     #  #                          #  #         #     #                             
    //  ##   ###    ##    ##   # #    #    ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   
    // #     #  #  # ##  #     ##      #   #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     
    // #     #  #  ##    #     # #   #  #  #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   
    //  ##   #  #   ##    ##   #  #   ##   ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###    
    //                                     #                                                            ###         
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        var max = 1,
            creeps;

        if (!canSpawn) {
            return {
                name: "healer",
                spawn: false,
                max: max
            };
        }

        var creeps = Cache.creeps[engine.room.name];

        return {
            name: "healer",
            spawn: _.filter(creeps && creeps.healer || [], (c) => c.spawning || c.ticksToLive >= 300).length < max,
            spawnFromRegion: true,
            max: max
        };
    }

    //                                 ##          #     #     #                       
    //                                #  #         #     #                             
    //  ###   ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   
    // ##     #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     
    //   ##   #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   
    // ###    ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###    
    //        #                                                            ###         
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        var energy = Math.min(checkSettings.energyCapacityAvailable, 7500),
            units = Math.floor(energy / 300),
            body = [];

        body.push(...Array(units).fill(MOVE));
        body.push(...Array(units).fill(HEAL));

        return {
            body: body,
            memory: {
                role: "healer",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].healer || []), (c) => !c.spawning),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If the creeps are not in the room, rally them.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.home), (creep) => {
            var task = TaskRally.getDefenderTask(creep);
            if (task.canAssign(creep)) {
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        
        // Find allies to heal.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = TaskHeal.getDefenderTask(creep);
            if (task && task.canAssign(creep)) {
                creep.say("Heal");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally the troops!
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.home), (creep) => {
            var task = TaskRally.getDefenderTask(creep);
            task.range = 1;
            if (task.canAssign(creep)) {
                assigned.push(creep.name);
            }
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleHealer, "RoleHealer");
}
module.exports = RoleHealer;
