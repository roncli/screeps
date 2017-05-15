var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskMeleeAttack = require("task.meleeAttack");

//  ####           ##           ####            ##                     #               
//  #   #           #            #  #          #  #                    #               
//  #   #   ###     #     ###    #  #   ###    #      ###   # ##    ## #   ###   # ##  
//  ####   #   #    #    #   #   #  #  #   #  ####   #   #  ##  #  #  ##  #   #  ##  # 
//  # #    #   #    #    #####   #  #  #####   #     #####  #   #  #   #  #####  #     
//  #  #   #   #    #    #       #  #  #       #     #      #   #  #  ##  #      #     
//  #   #   ###    ###    ###   ####    ###    #      ###   #   #   ## #   ###   #     
/**
 * Represents the defender role.
 */
class RoleDefender {
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
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine) {
        var creeps = Cache.creeps[engine.room.name],
            max = 1;

        return {
            name: "defender",
            spawn: _.filter(creeps && creeps.defender || [], (c) => c.spawning || c.ticksToLive >= 300).length < max,
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
        return {
            body: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL],
            memory: {
                role: "defender",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }

    static checkQuadrant(pos, quadrant) {
        switch (quadrant) {
            case 0:
                return pos.x < 25 && pos.y < 25;
            case 1:
                return pos.x < 25 && pos.y >= 25;
            case 2:
                return pos.x >= 25 && pos.y >= 25;
            case 3:
                return pos.x >= 25 && pos.y < 25;
        }
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].defender || []), (c) => !c.spawning),
            hostiles, keepers;
        
        if (room && !room.unobservable) {
            hostiles = Cache.hostilesInRoom(room);
            keepers = Cache.sourceKeepersInRoom(room);
        }
        
        _.forEach(creepsWithNoTask, (creep) => {
            // If the creep is not in the room, rally it.
            if (creep.room.name !== creep.memory.home) {
                var task = TaskRally.getDefenderTask(creep);
                task.canAssign(creep);
                return;
            }

            // Default to quadrant 0.
            if (!creep.memory.quadrant) {
                creep.memory.quadrant = 0;
            }

            // If there is a hostile in the quadrant, attack it.
            _.forEach(_.filter(hostiles, (h) => this.checkQuadrant(h.pos, creep.memory.quadrant)), (hostile) => {
                return !(new TaskMeleeAttack(hostile.id)).canAssign(creep);
            });

            if (creep.memory.currentTask) {
                return;
            }

            // If there is a source keeper in the quadrant under 200 ticks, move towards it.
            _.forEach(_.filter(keepers, (k) => k.ticksToSpawn < 200 && this.checkQuadrant(k.pos, creep.memory.quadrant)), (keeper) => {
                var task = new TaskRally(keeper.id, creep);
                task.range = 1;
                return !task.canAssign(creep);
            });

            if (creep.memory.currentTask) {
                return;
            }

            creep.memory.quadrant = (creep.memory.quadrant + 1) % 4;
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleDefender, "RoleDefender");
}
module.exports = RoleDefender;
