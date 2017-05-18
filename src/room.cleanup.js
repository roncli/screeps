var Cache = require("cache"),
    Commands = require("commands"),
    RoomEngine = require("roomEngine"),
    Utilities = require("utilities"),
    RoleRemoteDismantler = require("role.remoteDismantler"),
    RoleRemoteCollector = require("role.remoteCollector"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskDismantle = require("task.dismantle"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskPickupResource = require("task.pickupResource");

//  ####                         ###    ##                                      
//  #   #                       #   #    #                                      
//  #   #   ###    ###   ## #   #        #     ###    ###   # ##   #   #  # ##  
//  ####   #   #  #   #  # # #  #        #    #   #      #  ##  #  #   #  ##  # 
//  # #    #   #  #   #  # # #  #        #    #####   ####  #   #  #   #  ##  # 
//  #  #   #   #  #   #  # # #  #   #    #    #      #   #  #   #  #  ##  # ##  
//  #   #   ###    ###   #   #   ###    ###    ###    ####  #   #   ## #  #     
//                                                                        #     
//                                                                        #     
/**
 * A class that represents a cleanup room.
 */
class RoomCleanup extends RoomEngine {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates a new cleanup room.
     * @param {Room} room The room.
     */
    constructor(room) {
        super();
        this.type = "cleanup";
        this.room = room;
        this.supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom];
    }

    // ###   #  #  ###   
    // #  #  #  #  #  #  
    // #     #  #  #  #  
    // #      ###  #  #  
    /**
     * Run the room.
     */
    run() {
        var supportRoom = this.supportRoom,
            room, roomName, ramparts, structures, junk, tasks;

        // Can't see the support room, we have bigger problems, so just bail.
        if (!supportRoom) {
            return;
        }

        room = this.room;
        roomName = room.name;
        ramparts = [];
        structures = [];
        junk = [];

        // Get the tasks needed for this room.
        tasks = {
            collectEnergy: {
                cleanupTasks: []
            },
            collectMinerals: {
                cleanupTasks: []
            },
            fillEnergy: {
                storageTasks: TaskFillEnergy.getStorageTasks(supportRoom),
                containerTasks: TaskFillEnergy.getContainerTasks(supportRoom)
            },
            fillMinerals: {
                labTasks: TaskFillMinerals.getLabTasks(supportRoom),
                storageTasks: TaskFillMinerals.getStorageTasks(supportRoom),
                terminalTasks: TaskFillMinerals.getTerminalTasks(supportRoom)
            },
            remoteDismantle: {
                cleanupTasks: []
            },
            dismantle: {
                tasks: []
            },
            pickupResource: {
                tasks: []
            }
        };

        if (!this.room.unobservable) {
            let noEnergyStructures, energyStructures;

            if (Memory.dismantle && Memory.dismantle[roomName] && Memory.dismantle[roomName].length > 0) {
                let completed = [];

                _.forEach(Memory.dismantle[roomName], (pos) => {
                    var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                    if (structures.length === 0) {
                        completed.push(pos);
                    } else {
                        tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
                    }
                });
                _.forEach(completed, (complete) => {
                    _.remove(Memory.dismantle[roomName], (d) => d.x === complete.x && d.y === complete.y);
                });
            }

            // Find all ramparts.
            ramparts = _.filter(room.find(FIND_STRUCTURES), (s) => s.structureType === STRUCTURE_RAMPART);

            // Find all structures that aren't under ramparts, divided by whether they have energy or not.
            structures = _.filter(room.find(FIND_STRUCTURES), (s) => !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_ROAD) && !(s.structureType === STRUCTURE_WALL) && (ramparts.length === 0 || s.pos.getRangeTo(Utilities.objectsClosestToObj(ramparts, s)[0]) > 0));
            noEnergyStructures = _.filter(structures, (s) => s.structureType === STRUCTURE_NUKER || ((!s.energy || s.energy === 0) && (!s.store || _.sum(s.store) === 0) && (!s.mineralAmount || s.mineralAmount === 0)));
            energyStructures = _.filter(structures, (s) => s.structureType !== STRUCTURE_NUKER && (s.energy && s.energy > 0 || s.store && _.sum(s.store) > 0 || s.mineralAmount && s.mineralAmount > 0));

            // Find all walls and roads.
            junk = _.filter(room.find(FIND_STRUCTURES), (s) => [STRUCTURE_WALL, STRUCTURE_ROAD].indexOf(s.structureType) !== -1);

            // Collect energy and minerals from structures that aren't under ramparts.
            tasks.collectEnergy.cleanupTasks = TaskCollectEnergy.getCleanupTasks(energyStructures);
            tasks.collectMinerals.cleanupTasks = TaskCollectMinerals.getCleanupTasks(energyStructures);
            tasks.pickupResource.tasks = TaskPickupResource.getTasks(room);

            // Dismantle structures.
            tasks.remoteDismantle.cleanupTasks = [].concat.apply([], [TaskDismantle.getCleanupTasks(noEnergyStructures), TaskDismantle.getCleanupTasks(ramparts), TaskDismantle.getCleanupTasks(junk)]);

            if (energyStructures.length === 0 && tasks.remoteDismantle.cleanupTasks.length === 0 && tasks.pickupResource.tasks.length === 0) {
                let creeps = Cache.creeps[roomName];

                // Notify that the room is cleaned up.
                Game.notify(`Cleanup Room ${roomName} is squeaky clean!`);
                
                // No longer need remote collectors.
                _.forEach(creeps && creeps.remoteCollector || [], (creep) => {
                    var memory = creep.memory;

                    memory.role = "storer";
                    memory.home = supportRoom.name;
                });

                // No longer need dismantlers.
                _.forEach(creeps && creeps.remoteDismantler || [], (creep) => {
                    var memory = creep.memory;

                    memory.role = "upgrader";
                    memory.home = supportRoom.name;
                });

                // Eliminate the room from memory.
                Commands.setRoomType(roomName);
            }
        }

        // Spawn new creeps.
        this.checkSpawn(RoleRemoteDismantler, room.unobservable || structures.length > 0 || ramparts.length > 0 || junk.length > 0);
        this.checkSpawn(RoleRemoteCollector, true);

        // Assign tasks to creeps.                    
        RoleRemoteDismantler.assignTasks(room, tasks);
        RoleRemoteCollector.assignTasks(room, tasks);
    }

    //  #           ##   #       #   
    //  #          #  #  #           
    // ###    ##   #  #  ###     #   
    //  #    #  #  #  #  #  #    #   
    //  #    #  #  #  #  #  #    #   
    //   ##   ##    ##   ###   # #   
    //                          #    
    /**
     * Serialize the room to an object.
     */
    toObj() {
        Memory.rooms[this.room.name].roomType = {
            type: this.type,
            supportRoom: this.supportRoom.name
        };
    }

    //   #                      ##   #       #   
    //  # #                    #  #  #           
    //  #    ###    ##   # #   #  #  ###     #   
    // ###   #  #  #  #  ####  #  #  #  #    #   
    //  #    #     #  #  #  #  #  #  #  #    #   
    //  #    #      ##   #  #   ##   ###   # #   
    //                                      #    
    /**
     * Deserializes room from an object.
     * @param {Room} room The room to deserialize from.
     * @return {RoomCleanup} The deserialized room.
     */
    static fromObj(room) {
        return new RoomCleanup(room);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoomCleanup, "RoomCleanup");
}
module.exports = RoomCleanup;
