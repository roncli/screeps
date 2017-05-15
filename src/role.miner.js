var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),
    TaskRally = require("task.rally");

//  ####           ##           #   #    #                        
//  #   #           #           #   #                             
//  #   #   ###     #     ###   ## ##   ##    # ##    ###   # ##  
//  ####   #   #    #    #   #  # # #    #    ##  #  #   #  ##  # 
//  # #    #   #    #    #####  #   #    #    #   #  #####  #     
//  #  #   #   #    #    #      #   #    #    #   #  #      #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###   #     
/**
 * Represents the miner role.
 */
class RoleMiner {
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
        var room = engine.room,
            containers = Cache.containersInRoom(room),
            minerals = room.find(FIND_MINERALS),
            sources = [].concat.apply([], [room.find(FIND_SOURCES), minerals]),
            containerSource, minerals, sources, creeps, miners, containerIdToMineOn, isMineralHarvester;

        // If there are no containers or sources in the room, ignore the room.
        if (containers.length === 0 || sources.length === 0) {
            return {
                name: "miner",
                spawn: false,
                max: 0
            };
        }

        containerSource = Memory.containerSource;
        creeps = Cache.creeps[room.name];
        miners = creeps && creeps.miner || [];

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            var containerId = container.id,
                source, isMineral;

            if (!containerSource[containerId]) {
                containerSource[containerId] = Utilities.objectsClosestToObj(sources, container)[0].id;
            }

            source = Game.getObjectById(containerSource[containerId]);
            isMineral = source instanceof Mineral;
            
            // If this container is for a mineral, check to make sure it has resources.
            if (isMineral && source.mineralAmount === 0) {
                return;
            }

            // If we don't have a miner for this container, spawn one.
            if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150) && c.memory.container === containerId).length === 0) {
                containerIdToMineOn = containerId;
                isMineralHarvester = isMineral;
                return false;
            }
        });

        return {
            name: "miner",
            spawn: !!containerIdToMineOn,
            max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length,
            containerIdToMineOn: containerIdToMineOn,
            isMineralHarvester: isMineralHarvester
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
        var body = [];

        if (checkSettings.isMineralHarvester) {
            let energy = Math.min(checkSettings.energyCapacityAvailable, 4500),
                units = Math.floor(energy / 450),
                remainder = energy % 450;
            
            body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(MOVE));
            body.push(...Array(units * 4 + (remainder >= 150 ? 1 : 0) + (remainder >= 250 ? 1 : 0) + (remainder >= 350 ? 1 : 0)).fill(WORK));
        } else {
            body = [MOVE, WORK, WORK, WORK, WORK, WORK];
        }

        return {
            body: body,
            memory: {
                role: "miner",
                home: checkSettings.home,
                container: checkSettings.containerIdToMineOn
            }
        };
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].miner || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If not yet boosted, go get boosts.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            var task = new TaskRally(creep.memory.labs[0]);
            task.canAssign(creep);
            assigned.push(creep.name);
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign mine tasks.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskMine();
            if (task.canAssign(creep)) {
                creep.say("Mining");
            }
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleMiner, "RoleMiner");
}
module.exports = RoleMiner;
