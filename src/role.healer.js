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
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine) {
        var creeps = Cache.creeps[engine.room.name],
            max = 1;
        
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
     * @param {RoomEngine} engine The room engine to spawn for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(engine) {
        var energy = Math.min(engine.room.energyCapacityAvailable, 7500),
            units = Math.floor(energy / 300),
            body = [];

        body.push(...Array(units).fill(MOVE));
        body.push(...Array(units).fill(HEAL));

        return {
            body: body,
            name: "healer"
        };
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, count, spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Get the total energy in the room, limited to 7500.
        energy = Math.min(supportRoom.energyCapacityAvailable, 7500);
        units = Math.floor(energy / 300);

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        for (count = 0; count < units; count++) {
            body.push(HEAL);
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `healer-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "healer", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
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
