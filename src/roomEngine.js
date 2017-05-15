const Cache = require("cache"),
    Utilities = require("utilities");

//  ####                        #####                  #                 
//  #   #                       #                                        
//  #   #   ###    ###   ## #   #      # ##    ## #   ##    # ##    ###  
//  ####   #   #  #   #  # # #  ####   ##  #  #  #     #    ##  #  #   # 
//  # #    #   #  #   #  # # #  #      #   #   ##      #    #   #  ##### 
//  #  #   #   #  #   #  # # #  #      #   #  #        #    #   #  #     
//  #   #   ###    ###   #   #  #####  #   #   ###    ###   #   #   ###  
//                                            #   #                      
//                                             ###                       
/**
 * A class representing a room engine.
 */
class RoomEngine {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates a new room engine.
     */
    constructor() {}

    //       #                 #      ##                           
    //       #                 #     #  #                          
    //  ##   ###    ##    ##   # #    #    ###    ###  #  #  ###   
    // #     #  #  # ##  #     ##      #   #  #  #  #  #  #  #  #  
    // #     #  #  ##    #     # #   #  #  #  #  # ##  ####  #  #  
    //  ##   #  #   ##    ##   #  #   ##   ###    # #  ####  #  #  
    //                                     #                       
    /**
     * Checks whether we should spawn a creep for the role.
     * @param {object} Role The role of the creep.
     */
    checkSpawn(Role) {
        var room = this.room,
            roomName = room.name,
            roomLog = Cache.log.room[roomName],
            checkSettings = Role.checkSpawnSettings(this),
            creeps = Cache.creeps[roomName],
            count = creeps && creeps[Role.name] ? creeps[Role.name].length : 0,
            canBoost = false,
            spawnToUse, supportRoomName, supportRoom, spawnSettings, labsToBoostWith, name;

        // Output creep count in the report.
        if (roomLog && (checkSettings.max > 0 || count > 0)) {
            roomLog.creeps.push({
                role: checkSettings.name,
                count: count,
                max: checkSettings.max
            });
        }

        // Get the spawn to use.
        if (checkSettings.spawnFromRegion) {
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && s.room.memory.region === this.room.memory.region).sort((a, b) => (a.room.name === roomName ? 0 : 1) - (b.room.name === roomName ? 0 : 1))[0];
        } else {
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && s.room.name === this.room.name)[0];
        }

        // Bail if a spawn is not available.
        if (!spawnToUse) {
            return;
        }

        supportRoomName = checkSettings.supportRoom || roomName;
        supportRoom = Game.rooms[supportRoomName];

        // Set additional settings.
        checkSettings.home = checkSettings.roomToSpawnFor || roomName;
        checkSettings.supportRoom = supportRoomName;
        checkSettings.energyCapacityAvailable = room.energyCapacityAvailable;

        // Get the spawn settings from the role.
        spawnSettings = Role.spawnSettings(checkSettings);

        // Add labs to the spawn settings.
        if (Cache.labsInRoom(supportRoom).length > 0) {
            canBoost = !!(labsToBoostWith = Utilities.getLabToBoostWith(supportRoom, Object.keys(spawnSettings.boosts).length));
        }

        spawnSettings.labs = canBoost ? _.map(labsToBoostWith, (l) => l.id) : [];

        // Spawn the creep.
        name = spawnToUse.createCreep(spawnSettings.body, `${checkSettings.name}-${checkSettings.roomToSpawnFor || roomName}-${Game.time.toFixed(0).substring(4)}`, spawnSettings.memory);
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        if (typeof name !== "number") {
            // Set the labs to be in use.
            let labIndex = 0,
                labsInUse = supportRoom.memory.labsInUse;
            
            _.forEach(spawnSettings.boosts, (amount, resource) => {
                labsToBoostWith[labIndex].creepToBoost = name;
                labsToBoostWith[labIndex].resource = resource;
                labsToBoostWith[labIndex].amount = 30 * amount;
                labsInUse.push(labsToBoostWith[labIndex]);

                labIndex++;
            });

            // If anything is coming to fill the labs, stop them.
            if (Cache.creeps[supportRoomName]) {
                _.forEach(_.filter(Cache.creeps[supportRoomName].all, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && _.map(labsToBoostWith, (l) => l.id).indexOf(c.memory.currentTask.id) !== -1), (creep) => {
                    delete creep.memory.currentTask;
                });
            }
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoomEngine, "RoomEngine");
}
module.exports = RoomEngine;
