var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),
    TaskRally = require("task.rally");

//  ####           ##           ####                         #            #   #    #                        
//  #   #           #           #   #                        #            #   #                             
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###   ## ##   ##    # ##    ###   # ##  
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #  # # #    #    ##  #  #   #  ##  # 
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####  #   #    #    #   #  #####  #     
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #      #   #    #    #   #  #      #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   #   #   ###   #   #   ###   #     
/**
 * Represents the remote miner role.
 */
class RoleRemoteMiner {
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
    static checkSpawn(engine) {
        var room = engine.room,
            containers = Cache.containersInRoom(room),
            minerals = room.find(FIND_MINERALS),
            sources = [].concat.apply([], [room.find(FIND_SOURCES), minerals]),
            lengthToContainer, containerSource, supportRoom, supportRoomName, spawnsInRoom, creeps, miners, containerIdToMineOn, isMineralHarvester;

        // If there are no containers or sources in the room, ignore the room.
        if (containers.length === 0 || sources.length === 0) {
            return {
                spawn: false,
                max: 0
            };
        }

        lengthToContainer = Memory.lengthToContainer,
        supportRoom = engine.supportRoom,
        supportRoomName = supportRoom.name,
        spawnsInRoom = Cache.spawnsInRoom(supportRoom),
        containerSource = Memory.containerSource,
        creeps = Cache.creeps[room.name],
        miners = creeps && creeps.remoteMiner || [];

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            var containerId = container.id,
                lengthToThisContainer, source, isMineral;

            // Calculate path length from container to support room's storage.
            if (!lengthToContainer[containerId]) {
                lengthToContainer[containerId] = {};
            }

            lengthToThisContainer = lengthToContainer[containerId];

            if (!lengthToThisContainer[supportRoomName]) {
                lengthToThisContainer[supportRoomName] = PathFinder.search(container.pos, {pos: spawnsInRoom[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
            }

            if (!containerSource[containerId]) {
                containerSource[containerId] = Utilities.objectsClosestToObj(sources, container)[0].id;
            }

            source = Game.getObjectById(containerSource[containerId]);
            isMineral = source instanceof Mineral;

            // If this container is for a mineral, check to make sure it has resources.
            if (isMineral && source.mineralAmount === 0) {
                return;
            }

            // If we don't have a remote miner for this container, spawn one.
            if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150 + lengthToThisContainer[supportRoomName] * 3) && c.memory.container === containerId).length === 0) {
                containerIdToMineOn = containerId;
                isMineralHarvester = isMineral;
                return false;
            }
        });

        return {
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
     * @param {RoomEngine} engine The room engine to spawn for.
     * @param {bool} isMineralHarvester Whether this creep will be harvesting minerals or not.
     * @param {bool} isSourceRoom Whether this creep will be harvesting in a source keeper room or not.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(engine, isMineralHarvester, isSourceRoom) {
        var body = [];

        if (isMineralHarvester) {
            let energy = Math.min(engine.room.energyCapacityAvailable, 4500),
                units = Math.floor(energy / 450),
                remainder = energy % 450;
            
            body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(MOVE));
            body.push(...Array(units * 4 + (remainder >= 150 ? 1 : 0) + (remainder >= 250 ? 1 : 0) + (remainder >= 350 ? 1 : 0)).fill(WORK));
        } else {
            body = isSourceRoom ? [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK] : [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK];
        }

        return {
            body: body,
            name: "remoteMiner"
        };
    }

    static spawn(room, supportRoom, id) {
        var body = room.memory && room.memory.roomType && room.memory.roomType.type === "source" || /^[EW][1-9][0-9]*5[NS][1-9][0-9]*5$/.test(room.name) ? [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK] : [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, remainder, count, spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Do something different for minerals.
        if (Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), Game.getObjectById(id))[0] instanceof Mineral) {
            body = [];

            // Get the energy available, limiting to 4500.
            energy = Math.min(supportRoom.energyCapacityAvailable, 4500);
            units = Math.floor(energy / 450);
            remainder = energy % 450;

            // Create the body based on the energy.
            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            if (remainder >= 50) {
                body.push(MOVE);
            }

            for (count = 0; count < units; count++) {
                body.push(WORK);
                body.push(WORK);
                body.push(WORK);
                body.push(WORK);
            }

            if (remainder >= 150) {
                body.push(WORK);
            }

            if (remainder >= 250) {
                body.push(WORK);
            }

            if (remainder >= 350) {
                body.push(WORK);
            }
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteMiner-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteMiner", home: roomName, supportRoom: supportRoomName, container: id});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteMiner || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign mine tasks.
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskMine();
                if (task.canAssign(creep)) {
                    creep.say("Mining");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteMiner, "RoleRemoteMiner");
}
module.exports = RoleRemoteMiner;
