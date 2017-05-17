var Cache = require("cache"),
    Commands = require("commands"),
    RoomMine = require("room.mine"),
    RoleDefender = require("role.defender"),
    RoleHealer = require("role.healer"),
    RoleRemoteCollector = require("role.remoteCollector");

//  ####                         ###                                     
//  #   #                       #   #                                    
//  #   #   ###    ###   ## #   #       ###   #   #  # ##    ###    ###  
//  ####   #   #  #   #  # # #   ###   #   #  #   #  ##  #  #   #  #   # 
//  # #    #   #  #   #  # # #      #  #   #  #   #  #      #      ##### 
//  #  #   #   #  #   #  # # #  #   #  #   #  #  ##  #      #   #  #     
//  #   #   ###    ###   #   #   ###    ###    ## #  #       ###    ###  
/**
 * A class that represents a source room.
 */
class RoomSource extends RoomMine {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates a new source room.
     * @param {Room} room The room.
     */
    constructor(room) {
        super(room);

        this.type = "source";

        // We cannot convert source rooms, so remove the method.
        delete this.convert;
    }

    //         #                       #     ##                           
    //         #                      ##    #  #                          
    //  ###   ###    ###   ###   ##    #     #    ###    ###  #  #  ###   
    // ##      #    #  #  #  #  # ##   #      #   #  #  #  #  #  #  #  #  
    //   ##    #    # ##   ##   ##     #    #  #  #  #  # ##  ####  #  #  
    // ###      ##   # #  #      ##   ###    ##   ###    # #  ####  #  #  
    //                     ###                    #                       
    /**
     * Spawns creeps while the room is in stage 1.
     */
    stage1Spawn() {
        var creeps = Cache.creeps[this.room.name],
            defenders = creeps.defender;
        
        this.checkSpawn(RoleDefender);
        this.checkSpawn(RoleHealer);

        if (!creeps || !defenders || _.filter(defenders, (c) => !c.spawning).length === 0) {
            return;
        }

        // Call original method.
        super.stage1Spawn();
    }

    //         #                       #     ##                  #                ###                #            
    //         #                      ##    #  #                                   #                 #            
    //  ###   ###    ###   ###   ##    #    #  #   ###    ###   ##     ###  ###    #     ###   ###   # #    ###   
    // ##      #    #  #  #  #  # ##   #    ####  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##     
    //   ##    #    # ##   ##   ##     #    #  #    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##   
    // ###      ##   # #  #      ##   ###   #  #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###    
    //                     ###                                         ###                                        
    /**
     * Assigns tasks to creeps while the room is in stage 1.
     * @param {object} tasks 
     */
    stage1AssignTasks(tasks) {
        var room = this.room;

        RoleDefender.assignTasks(room, tasks);
        RoleHealer.assignTasks(room, tasks);

        // Call original method.
        super.stage1AssignTasks(tasks);
    }

    //    #          #                  #  
    //    #         # #                 #  
    //  ###   ##    #     ##   ###    ###  
    // #  #  # ##  ###   # ##  #  #  #  #  
    // #  #  ##     #    ##    #  #  #  #  
    //  ###   ##    #     ##   #  #   ###  
    /**
     * Defends the room from invaders.
     */
    defend() {
        var room = this.room,
            roomName = room.name,
            armyName = `${roomName}-defense`,
            army = Memory.army[armyName],
            supportRoomName = this.supportRoom.name;
        
        if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
            // If there are invaders in the room, spawn an army if we don't have one.
            if (!army) {
                Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 2, units: 17}, melee: {maxCreeps: 2, units: 20}, ranged: {maxCreeps: 0, units: 20}});
            }
        } else if (army) {
            // Cancel army if invaders are gone.
            army.directive = "attack";
            army.success = true;
        }
    }

    //         #                       ##    ##                           
    //         #                      #  #  #  #                          
    //  ###   ###    ###   ###   ##      #   #    ###    ###  #  #  ###   
    // ##      #    #  #  #  #  # ##    #     #   #  #  #  #  #  #  #  #  
    //   ##    #    # ##   ##   ##     #    #  #  #  #  # ##  ####  #  #  
    // ###      ##   # #  #      ##   ####   ##   ###    # #  ####  #  #  
    //                     ###                    #                       
    /**
     * Spawns creeps while the room is in stage 2.
     */
    stage2Spawn() {
        var creeps = Cache.creeps[this.room.name],
            defenders = creeps.defender;
console.log(`Source Spawn for ${this.room.name}`);        
        this.checkSpawn(RoleDefender);
        this.checkSpawn(RoleHealer);

        if (!creeps || !defenders || _.filter(defenders, (c) => !c.spawning).length === 0) {
            return;
        }

        // Call original method.
        super.stage2Spawn();

        this.checkSpawn(RoleRemoteCollector);
    }

    //         #                       ##    ##                  #                ###                #            
    //         #                      #  #  #  #                                   #                 #            
    //  ###   ###    ###   ###   ##      #  #  #   ###    ###   ##     ###  ###    #     ###   ###   # #    ###   
    // ##      #    #  #  #  #  # ##    #   ####  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##     
    //   ##    #    # ##   ##   ##     #    #  #    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##   
    // ###      ##   # #  #      ##   ####  #  #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###    
    //                     ###                                         ###                                        
    /**
     * Assigns tasks to creeps while the room is in stage 2.
     * @param {object} tasks 
     */
    stage2AssignTasks(tasks) {
        var room = this.room;

        RoleDefender.assignTasks(room, tasks);
        RoleHealer.assignTasks(room, tasks);

        // Call original method.
        super.stage2AssignTasks(tasks);

        RoleRemoteCollector.assignTasks(room, tasks);
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
     * @return {RoomSource} The deserialized room.
     */
    static fromObj(room) {
        return new RoomSource(room);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoomSource, "RoomSource");
}
module.exports = RoomSource;
