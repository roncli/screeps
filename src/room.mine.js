var Cache = require("cache"),
    Commands = require("commands"),
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

class Mine {
    constructor(supportRoom, stage) {
        "use strict";
        
        this.type = "mine";
        this.supportRoom = supportRoom;
        this.stage = stage || 1;
    }

    convert(room, supportRoom) {
        var roomName = room.name,
            memory = Memory.rooms[roomName],
            oldRoomType = memory.roomType.type;

        Commands.setRoomType(roomName, {type: "base", region: memory.region});
        Commands.claimRoom(this.supportRoom, roomName, false);
        
        switch (oldRoomType) {
            case "mine":
                _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].all || [], (creep) => {
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
                            creepMemory.home = this.supportRoom;
                            break;
                        case "dismantler":
                            creepMemory.home = roomName;
                            creepMemory.supportRoom = roomName;
                            break;
                    }
                });
        }
        return;
    }

    stage1Tasks(room, supportRoom) {
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

    stage1Spawn(room) {
        RoleRemoteReserver.checkSpawn(room);
        RoleRemoteBuilder.checkSpawn(room);
    }

    stage1AssignTasks(room, tasks) {
        RoleRemoteReserver.assignTasks(room, tasks);
        RoleRemoteBuilder.assignTasks(room);
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
    }

    stage1Manage(room, supportRoom) {
        var supportRoomName = supportRoom.name,
            sources, containers, roomName, armyName, sites;
        
        if (!room.unobservable) {
            sources = [].concat.apply([], [room.find(FIND_SOURCES), /^[EW][1-9][0-9]*5[NS][1-9][0-9]*5$/.test(room.name) ? room.find(FIND_MINERALS) : []]);
            containers = Cache.containersInRoom(room);
            roomName = room.name;

            // Check to see if we have built containers.  If so, move to stage 2.
            if (containers.length >= sources.length) {
                this.stage = 2;

                // Loop through containers to get first container by source.
                _.forEach(containers, (container) => {
                    var source = Utilities.objectsClosestToObj([].concat.apply([], [sources, room.find(FIND_MINERALS)]), container)[0];

                    // If this container is for a mineral, skip it.
                    if (source instanceof Mineral) {
                        return;
                    }

                    // Convert builders to workers.
                    _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || [], (creep) => {
                        creep.memory.role = "remoteWorker";
                        creep.memory.container = Utilities.objectsClosestToObj(containers, source)[0].id;
                    });
                    return false;
                });

                return;
            }

            // Check to see if we have construction sites for the containers.  If not, create them.
            sites = room.find(FIND_MY_CONSTRUCTION_SITES);
            if (sites.length === 0) {
                _.forEach(sources, (source) => {
                    var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1}).path[0];

                    if (
                        _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                        _.filter(sites, (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
                    ) {
                        // Build the container.
                        room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
                    }
                });
            } 

            armyName = `${roomName}-defense`;
            if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
                // If there are invaders in the room, spawn an army if we don't have one.
                if (!Memory.army[armyName]) {
                    Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 1, units: Math.min(Math.floor((supportRoom.energyCapacityAvailable - 300) / 300), 20)}, melee: {maxCreeps: 1, units: Math.min(Math.floor((supportRoom.energyCapacityAvailable - 300) / 130), 20)}, ranged: {maxCreeps: 0, units: 20}});
                }
            } else if (Memory.army[armyName]) {
                // Cancel army if invaders are gone.
                Memory.army[armyName].directive = "attack";
                Memory.army[armyName].success = true;
            }
        }
    }

    stage1(room, supportRoom) {
        // Get tasks.
        var tasks = this.stage1Tasks(room, supportRoom);

        // Spawn new creeps.
        this.stage1Spawn(room);

        // Assign tasks to creeps.
        this.stage1AssignTasks(room, tasks);

        this.stage1Manage(room, supportRoom);
    }

    stage2Manage(room, supportRoom) {
        var roomName = room.name,
            supportRoomName = supportRoom.name,
            sources, armyName;

        // If we've lost all our creeps, something probably went wrong, so revert to stage 1.
        if (room.unobservable) {
            if (
                (Cache.creeps[roomName] && Cache.creeps[roomName].remoteMiner || []).length === 0 &&
                (Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []).length === 0 &&
                (Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []).length === 0 &&
                (Cache.creeps[roomName] && Cache.creeps[roomName].remoteReserver || []).length === 0
            ) {
                this.stage = 1;
                return;
            }
        } else {
            sources = [].concat.apply([], [room.find(FIND_SOURCES), /^[EW][1-9][0-9]*5[NS][1-9][0-9]*5$/.test(room.name) ? room.find(FIND_MINERALS) : []])

            // Check to see if we lost built containers.  If so, move to stage 1.
            if (Cache.containersInRoom(room).length < sources.length) {
                this.stage = 1;
                return;
            }

            armyName = `${roomName}-defense`;
            if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
                // If there are invaders in the room, spawn an army if we don't have one.
                if (!Memory.army[armyName]) {
                    Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 1, units: Math.min(Math.floor((supportRoom.energyCapacityAvailable - 300) / 300), 20)}, melee: {maxCreeps: 1, units: Math.min(Math.floor((supportRoom.energyCapacityAvailable - 300) / 130), 20)}, ranged: {maxCreeps: 0, units: 20}});
                }
            } else if (Memory.army[armyName]) {
                // Cancel army if invaders are gone.
                Memory.army[armyName].directive = "attack";
                Memory.army[armyName].success = true;
            }
        }
    }

    stage2Spawn(room, supportRoom) {
        var dismantle = Memory.dismantle;
        
        // Bail if there are hostiles.
        if (Cache.hostilesInRoom(room).length > 0) {
            return;
        }
        
        RoleRemoteReserver.checkSpawn(room);
        RoleRemoteMiner.checkSpawn(room);
        RoleRemoteWorker.checkSpawn(room);
        RoleRemoteStorer.checkSpawn(room);
        if (dismantle && dismantle[room.name] && dismantle[room.name].length > 0) {
            RoleDismantler.checkSpawn(room, supportRoom);
        }
    }

    stage2Tasks(room, supportRoom) {
        var roomName = room.name,
            creeps = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []).length > 0 || Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []).length > 0 || Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteDismantler || []).length > 0,
            tasks = {
                fillEnergy: {
                    storageTasks: creeps ? TaskFillEnergy.getStorageTasks(supportRoom) : [],
                    containerTasks: creeps ? TaskFillEnergy.getContainerTasks(supportRoom) : []
                },
                fillMinerals: {
                    storageTasks: creeps ? TaskFillMinerals.getStorageTasks(supportRoom) : [],
                    terminalTasks: creeps ? TaskFillMinerals.getTerminalTasks(supportRoom) : []
                }
            };

        // Get tasks.
        if (!room.unobservable) {
            let dismantle = Memory.dismantle;
            tasks.dismantle = {
                tasks: []
            };

            if (dismantle && dismantle[roomName] && dismantle[roomName].length > 0) {
                let completed = [];
                
                _.forEach(dismantle[roomName], (pos) => {
                    var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                    if (structures.length === 0) {
                        completed.push(pos);
                    } else {
                        tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
                    }
                });
                _.forEach(completed, (complete) => {
                    _.remove(dismantle[roomName], (d) => d.x === complete.x && d.y === complete.y);
                });
            } else {
                _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].dismantler || [], (creep) => {
                    creep.memory.role = "remoteWorker";
                    creep.memory.container = Cache.containersInRoom(room)[0].id;
                });
            }
        }
        
        return tasks;
    }

    stage2AssignTasks(room, tasks) {
        RoleRemoteReserver.assignTasks(room, tasks);
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
    }

    stage2(room, supportRoom) {
        var tasks;

        // Manage room and bail if it got reset to stage 1.    
        this.stage2Manage(room, supportRoom);
        if (this.stage === 1) {
            return;
        }
        
        // Spawn new creeps.
        if (!room.unobservable) {
            this.stage2Spawn(room, supportRoom);
        }
        
        // Get the tasks needed for this room.
        tasks = this.stage2Tasks(room, supportRoom);

        // Assign tasks to creeps.
        this.stage2AssignTasks(room, tasks);
    }

    run(room) {
        var supportRoom;

        // If there are no energy sources, bail.
        if (!room.unobservable && room.find(FIND_SOURCES).length === 0) {
            return;
        }

        // Can't see the support room, we have bigger problems, so just bail.
        if (!(supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom])) {
            return;
        }

        // If the controller is ours, convert this to a base.
        if (room.controller && room.controller.my) {
            this.convert(room, supportRoom);
            return;
        }

        if (this.stage === 1) {
            this.stage1(room, supportRoom);
        }

        if (this.stage === 2) {
            this.stage2(room, supportRoom);
        }
    }

    toObj(room) {
        Memory.rooms[room.name].roomType = {
            type: this.type,
            supportRoom: this.supportRoom,
            stage: this.stage
        };
    }

    static fromObj(roomMemory) {
        return new Mine(roomMemory.roomType.supportRoom, roomMemory.roomType.stage);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Mine, "RoomMine");
}
module.exports = Mine;
