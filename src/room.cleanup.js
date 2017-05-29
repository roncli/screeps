var Cache = require("cache"),
    Commands = require("commands"),
    RoomEngine = require("roomEngine"),
    Utilities = require("utilities"),
    RoleRemoteDismantler = require("role.remoteDismantler"),
    RoleRemoteCollector = require("role.remoteCollector");

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
        var tasks;

        // Can't see the support room, we have bigger problems, so just bail.
        if (!this.supportRoom) {
            return;
        }

        // Get the tasks needed for this room.
        if (!this.room.unobservable) {
            tasks = this.tasks();
        }

        // Spawn new creeps if there are available spawns in the region.
        this.spawn();

        // Assign tasks to creeps and towers.
        this.assignTasks(tasks);
    }

    //  #                 #            
    //  #                 #            
    // ###    ###   ###   # #    ###   
    //  #    #  #  ##     ##    ##     
    //  #    # ##    ##   # #     ##   
    //   ##   # #  ###    #  #  ###    
    tasks() {
        var supportRoom = this.supportRoom,
            room = this.room,
            roomName = room.name,
            tasks;

        this.tasks = {};
        tasks = this.tasks;

        // Find all ramparts.
        tasks.ramparts = _.filter(room.find(FIND_STRUCTURES), (s) => s.structureType === STRUCTURE_RAMPART);

        // Find all structures that aren't under ramparts, divided by whether they have resources or not.
        tasks.structures = _.filter(room.find(FIND_STRUCTURES), (s) => !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_ROAD) && !(s.structureType === STRUCTURE_WALL) && (tasks.ramparts.length === 0 || s.pos.getRangeTo(Utilities.objectsClosestToObj(tasks.ramparts, s)[0]) > 0));
        tasks.noResourceStructures = _.filter(tasks.structures, (s) => s.structureType === STRUCTURE_NUKER || ((!s.energy || s.energy === 0) && (!s.store || _.sum(s.store) === 0) && (!s.mineralAmount || s.mineralAmount === 0)));
        tasks.resourceStructures = _.filter(tasks.structures, (s) => s.structureType !== STRUCTURE_NUKER && (s.energy && s.energy > 0 || s.store && _.sum(s.store) > 0 || s.mineralAmount && s.mineralAmount > 0));

        // Find all walls and roads.
        tasks.junk = _.filter(room.find(FIND_STRUCTURES), (s) => [STRUCTURE_WALL, STRUCTURE_ROAD].indexOf(s.structureType) !== -1);

        // Collect energy and minerals from structures that aren't under ramparts.
        tasks.energyStructures = _.filter(tasks.resourceStructures, (s) => s.energy || (s.store && s.store[RESOURCE_ENERGY])).sort((a, b) => (a.energy || a.store[RESOURCE_ENERGY]) - (b.energy || b.store[RESOURCE_ENERGY]));
        tasks.mineralStructures = _.filter(tasks.resourceStructures, (s) => (s.store || [STRUCTURE_LAB, STRUCTURE_POWER_SPAWN].indexOf(s.structureType) !== -1) && ((_.sum(s.store) > 0 && s.store[RESOURCE_ENERGY] < _.sum(s.store)) || s.mineralAmount > 0 || s.power > 0)).sort((a, b) => (a.mineralAmount || a.power || (_.sum(a.store) - a.store[RESOURCE_ENERGY])) - (b.mineralAmount || b.power || (_.sum(b.store) - b.store[RESOURCE_ENERGY])));

        // Resources to pickup.
        tasks.resources = Cache.resourcesInRoom(room);

        // Dismantle structures.
        tasks.dismantle = [].concat.apply([], [tasks.noResourceStructures, tasks.ramparts, tasks.junk]);

        // Hostile construction sites.
        tasks.hostileConstructionSites = Cache.hostileConstructionSitesInRoom(room);

        if (tasks.resourceStructures.length === 0 && tasks.dismantle.length === 0 && tasks.resources.length === 0) {
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

    //  ###   ###    ###  #  #  ###   
    // ##     #  #  #  #  #  #  #  #  
    //   ##   #  #  # ##  ####  #  #  
    // ###    ###    # #  ####  #  #  
    //        #                       
    spawn() {
        var tasks = this.tasks;

        // Spawn new creeps.
        this.checkSpawn(RoleRemoteDismantler, this.room.unobservable || tasks.structures.length > 0 || tasks.ramparts.length > 0 || tasks.length > 0);
        this.checkSpawn(RoleRemoteCollector, true);
    }

    //                      #                ###                #            
    //                                        #                 #            
    //  ###   ###    ###   ##     ###  ###    #     ###   ###   # #    ###   
    // #  #  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##     
    // # ##    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##   
    //  # #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###    
    //                            ###                                        
    assignTasks() {
        // Assign tasks to creeps.                    
        RoleRemoteDismantler.assignTasks(this);
        RoleRemoteCollector.assignTasks(this);
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
