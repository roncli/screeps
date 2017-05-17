var Cache = require("cache"),
    Commands = require("commands"),
    RoomEngine = require("roomEngine"),
    Utilities = require("utilities"),
    RoleDismantler = require("role.dismantler"),
    RoleRemoteBuilder = require("role.remoteBuilder"),
    RoleRemoteMiner = require("role.remoteMiner"),
    RoleRemoteReserver = require("role.remoteReserver"),
    RoleRemoteStorer = require("role.remoteStorer"),
    RoleRemoteWorker = require("role.remoteWorker"),
    TaskBuild = require("task.build"),
    TaskDismantle = require("task.dismantle"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals");

//  ####                        #   #    #                 
//  #   #                       #   #                      
//  #   #   ###    ###   ## #   ## ##   ##    # ##    ###  
//  ####   #   #  #   #  # # #  # # #    #    ##  #  #   # 
//  # #    #   #  #   #  # # #  #   #    #    #   #  ##### 
//  #  #   #   #  #   #  # # #  #   #    #    #   #  #     
//  #   #   ###    ###   #   #  #   #   ###   #   #   ###  
/**
 * A class that represents a mine room.
 */
class RoomMine extends RoomEngine {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Creates a new mine room.
     * @param {Room} room The room.
     */
    constructor(room) {
        var roomType = Memory.rooms[room.name].roomType;

        super();
        this.type = "mine";
        this.room = room;
        this.supportRoom = Game.rooms[roomType.supportRoom];
        this.stage = roomType.stage || 1;
    }

    // ###   #  #  ###   
    // #  #  #  #  #  #  
    // #     #  #  #  #  
    // #      ###  #  #  
    /**
     * Runs the room.
     */
    run() {
        var room = this.room,
            controller = room.controller;

        // If there are no energy sources, bail.
        if (!room.unobservable && room.find(FIND_SOURCES).length === 0) {
            return;
        }

        // Can't see the support room, we have bigger problems, so just bail.
        if (!Game.rooms[Memory.rooms[room.name].roomType.supportRoom]) {
            return;
        }

        // If the controller is ours, convert this to a base.
        if (this.type === "mine" && controller && controller.my) {
            this.convert();
            return;
        }

        if (this.stage === 1) {
            this.stage1();
        }

        if (this.stage === 2) {
            this.stage2();
        }
    }

    //                                      #    
    //                                      #    
    //  ##    ##   ###   # #    ##   ###   ###   
    // #     #  #  #  #  # #   # ##  #  #   #    
    // #     #  #  #  #  # #   ##    #      #    
    //  ##    ##   #  #   #     ##   #       ##  
    /**
     * Converts the mine to a base.
     */
    convert() {
        var supportRoomName = this.supportRoom.name,
            room = this.room,
            roomName = room.name,
            memory = Memory.rooms[roomName],
            creeps = Cache.creeps[roomName];

        Commands.claimRoom(supportRoomName, roomName, false);
        Commands.setRoomType(roomName, {type: "base", region: memory.region});
        
        _.forEach(creeps && creeps.all || [], (creep) => {
            var creepMemory = creep.memory;
            
            switch (creepMemory.role) {
                case "remoteBuilder":
                case "remoteWorker":
                    creepMemory.role = "worker";
                    creepMemory.home = roomName;
                    creepMemory.homeSource = Utilities.objectsClosestToObj(room.find(FIND_SOURCES), creep)[0].id;
                    break;
                case "remoteReserver":
                    creep.suicide();
                    break;
                case "remoteStorer":
                    creepMemory.role = "storer";
                    creepMemory.home = supportRoomName;
                    break;
                case "dismantler":
                    creepMemory.home = roomName;
                    creepMemory.supportRoom = roomName;
                    break;
            }
        });
    }

    //         #                       #    
    //         #                      ##    
    //  ###   ###    ###   ###   ##    #    
    // ##      #    #  #  #  #  # ##   #    
    //   ##    #    # ##   ##   ##     #    
    // ###      ##   # #  #      ##   ###   
    //                     ###              
    /**
     * Runs the room while it is in stage 1.
     */
    stage1() {
        // Get tasks.
        var tasks = this.stage1Tasks();

        // Spawn new creeps.
        this.stage1Spawn();

        // Assign tasks to creeps.
        this.stage1AssignTasks(tasks);

        if (!this.room.unobservable) {
            this.stage1Manage();
            this.defend();
        }
    }

    //         #                       #    ###                #            
    //         #                      ##     #                 #            
    //  ###   ###    ###   ###   ##    #     #     ###   ###   # #    ###   
    // ##      #    #  #  #  #  # ##   #     #    #  #  ##     ##    ##     
    //   ##    #    # ##   ##   ##     #     #    # ##    ##   # #     ##   
    // ###      ##   # #  #      ##   ###    #     # #  ###    #  #  ###    
    //                     ###                                              
    /**
     * Tasks to perform while the room is in stage 1.
     */
    stage1Tasks() {
        var supportRoom = this.supportRoom,
            room = this.room;

        var tasks = {
            fillEnergy: {
                storageTasks: TaskFillEnergy.getStorageTasks(supportRoom),
                containerTasks: TaskFillEnergy.getContainerTasks(supportRoom)
            },
            fillMinerals: {
                storageTasks: TaskFillMinerals.getStorageTasks(supportRoom),
                terminalTasks: TaskFillMinerals.getTerminalTasks(supportRoom)
            },
            dismantle: {
                tasks: []
            }
        };
        
        if (!room.unobservable) {
            tasks.build = {
                tasks: TaskBuild.getTasks(room)
            };
        }
        
        return tasks;
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
        this.checkSpawn(RoleRemoteReserver, this.room.controller);
        this.checkSpawn(RoleRemoteBuilder);
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

        if (room.controller) {
            RoleRemoteReserver.assignTasks(room, tasks);
        }
        RoleRemoteBuilder.assignTasks(room);
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
    }

    //         #                       #    #  #                                
    //         #                      ##    ####                                
    //  ###   ###    ###   ###   ##    #    ####   ###  ###    ###   ###   ##   
    // ##      #    #  #  #  #  # ##   #    #  #  #  #  #  #  #  #  #  #  # ##  
    //   ##    #    # ##   ##   ##     #    #  #  # ##  #  #  # ##   ##   ##    
    // ###      ##   # #  #      ##   ###   #  #   # #  #  #   # #  #      ##   
    //                     ###                                       ###        
    /**
     * Manages the room while it is in stage 1.
     */
    stage1Manage() {
        var room = this.room,
            roomName = room.name,
            minerals = room.find(FIND_MINERALS),
            energySources = room.find(FIND_SOURCES),
            sources = [].concat.apply([], [energySources, /^[EW][0-9]*[4-6][NS][0-9]*[4-6]$/.test(roomName) ? minerals : []]),
            containers = Cache.containersInRoom(room),
            allSources = [].concat.apply([], [energySources, minerals]),
            creeps = Cache.creeps[roomName],
            sites;

        // Check to see if we have built containers.  If so, move to stage 2.
        if (containers.length >= sources.length) {
            this.stage = 2;

            // Loop through containers to get first container by source.
            _.forEach(containers, (container) => {
                var source = Utilities.objectsClosestToObj(allSources, container)[0];

                // If this container is for a mineral, skip it.
                if (source instanceof Mineral) {
                    return;
                }

                // Convert builders to workers.
                _.forEach(creeps && creeps.remoteBuilder || [], (creep) => {
                    var memory = creep.memory;

                    memory.role = "remoteWorker";
                    memory.container = Utilities.objectsClosestToObj(containers, source)[0].id;
                });
                return false;
            });

            return;
        }

        // Check to see if we have construction sites for the containers.  If not, create them.
        sites = room.find(FIND_MY_CONSTRUCTION_SITES);

        if (sites.length === 0) {
            _.forEach(sources, (source) => {
                var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(this.supportRoom)[0].pos, range: 1}, {swampCost: 1}).path[0];

                if (
                    _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
                ) {
                    // Build the container.
                    room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
                }
            });
        } 
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
            supportRoom = this.supportRoom,
            supportRoomName = supportRoom.name;
        
        if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
            // If there are invaders in the room, spawn an army if we don't have one.
            if (!army) {
                let energyCapacityAvailable = supportRoom.energyCapacityAvailable;

                Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 1, units: Math.min(Math.floor((energyCapacityAvailable - 300) / 300), 20)}, melee: {maxCreeps: 1, units: Math.min(Math.floor((energyCapacityAvailable - 300) / 130), 20)}, ranged: {maxCreeps: 0, units: 20}});
            }
        } else if (army) {
            // Cancel army if invaders are gone.
            army.directive = "attack";
            army.success = true;
        }
    }

    //         #                       ##   
    //         #                      #  #  
    //  ###   ###    ###   ###   ##      #  
    // ##      #    #  #  #  #  # ##    #   
    //   ##    #    # ##   ##   ##     #    
    // ###      ##   # #  #      ##   ####  
    //                     ###              
    /**
     * Runs the room while it is in stage 2.
     */
    stage2() {
        var tasks;

        // Manage room and bail if it got reset to stage 1.    
        this.stage2Manage();
        this.defend();
        
        if (this.stage === 1) {
            return;
        }
        
        // Get the tasks needed for this room.
        tasks = this.stage2Tasks();

        // Spawn new creeps.
        if (!this.room.unobservable) {
            this.stage2Spawn();
        }
        
        // Assign tasks to creeps.
        this.stage2AssignTasks(tasks);
    }

    //         #                       ##   #  #                                
    //         #                      #  #  ####                                
    //  ###   ###    ###   ###   ##      #  ####   ###  ###    ###   ###   ##   
    // ##      #    #  #  #  #  # ##    #   #  #  #  #  #  #  #  #  #  #  # ##  
    //   ##    #    # ##   ##   ##     #    #  #  # ##  #  #  # ##   ##   ##    
    // ###      ##   # #  #      ##   ####  #  #   # #  #  #   # #  #      ##   
    //                     ###                                       ###        
    /**
     * Manages the room while it is in stage 2.
     */
    stage2Manage() {
        var room = this.room,
            roomName = room.name,
            creeps = Cache.creeps[roomName];

        // If we've lost all our creeps, something probably went wrong, so revert to stage 1.
        if (room.unobservable) {
            if (
                (creeps && creeps.remoteMiner || []).length === 0 &&
                (creeps && creeps.remoteWorker || []).length === 0 &&
                (creeps && creeps.remoteStorer || []).length === 0 &&
                (creeps && creeps.remoteReserver || []).length === 0
            ) {
                this.stage = 1;
            }
        } else {
            // Check to see if we lost built containers.  If so, move to stage 1.
            if (Cache.containersInRoom(room).length < [].concat.apply([], [room.find(FIND_SOURCES), /^[EW][0-9]*[4-6][NS][0-9]*[4-6]$/.test(room.name) ? room.find(FIND_MINERALS) : []]).length) {
                this.stage = 1;
            }
        }
    }

    //         #                       ##   ###                #            
    //         #                      #  #   #                 #            
    //  ###   ###    ###   ###   ##      #   #     ###   ###   # #    ###   
    // ##      #    #  #  #  #  # ##    #    #    #  #  ##     ##    ##     
    //   ##    #    # ##   ##   ##     #     #    # ##    ##   # #     ##   
    // ###      ##   # #  #      ##   ####   #     # #  ###    #  #  ###    
    //                     ###                                              
    /**
     * Tasks to perform while the room is in stage 1.
     */
    stage2Tasks() {
        var room = this.room,
            roomName = room.name,
            supportRoom = this.supportRoom,
            creeps = Cache.creeps[roomName],
            carryCreeps =
                Utilities.creepsWithNoTask(creeps && creeps.remoteWorker || []).length > 0 ||
                Utilities.creepsWithNoTask(creeps && creeps.remoteStorer || []).length > 0 ||
                Utilities.creepsWithNoTask(creeps && creeps.remoteDismantler || []).length > 0,
            tasks = {
                fillEnergy: {
                    storageTasks: carryCreeps ? TaskFillEnergy.getStorageTasks(supportRoom) : [],
                    containerTasks: carryCreeps ? TaskFillEnergy.getContainerTasks(supportRoom) : []
                },
                fillMinerals: {
                    storageTasks: carryCreeps ? TaskFillMinerals.getStorageTasks(supportRoom) : [],
                    terminalTasks: carryCreeps ? TaskFillMinerals.getTerminalTasks(supportRoom) : []
                }
            };

        if (!room.unobservable) {
            let dismantle = Memory.dismantle,
                dismantleRoom = dismantle[roomName];

            tasks.dismantle = {
                tasks: []
            };

            if (dismantle && dismantleRoom && dismantleRoom.length > 0) {
                let completed = [];
                
                _.forEach(dismantleRoom, (pos) => {
                    var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                    if (structures.length === 0) {
                        completed.push(pos);
                    } else {
                        tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
                    }
                });
                _.forEach(completed, (complete) => {
                    _.remove(dismantleRoom, (d) => d.x === complete.x && d.y === complete.y);
                });
            } else {
                let containerId = Cache.containersInRoom(room)[0].id;

                _.forEach(creeps && creeps.dismantler || [], (creep) => {
                    var memory = creep.memory;

                    memory.role = "remoteWorker";
                    memory.container = containerId;
                });
            }
        }
        
        return tasks;
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
        var room = this.room,
            dismantle, dismantleRoom;

        // Bail if there are hostiles.
        if (Cache.hostilesInRoom(room).length > 0) {
            return;
        }

        dismantle = Memory.dismantle;
        dismantleRoom = dismantle[room.name];
        
        this.checkSpawn(RoleRemoteReserver, room.controller);
        this.checkSpawn(RoleRemoteMiner);
        this.checkSpawn(RoleRemoteWorker);
        this.checkSpawn(RoleRemoteStorer);
        this.checkSpawn(RoleDismantler, dismantle && dismantleRoom && dismantleRoom.length > 0);
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

        if (room.controller) {
            RoleRemoteReserver.assignTasks(room, tasks);
        }
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
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
            supportRoom: this.supportRoom.name,
            stage: this.stage
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
     * @return {RoomMine} The deserialized room.
     */
    static fromObj(room) {
        return new RoomMine(room);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoomMine, "RoomMine");
}
module.exports = RoomMine;
