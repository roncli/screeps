var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    RoleDismantler = require("role.dismantler"),
    RoleRemoteDismantler = require("role.remoteDismantler"),
    RoleRemoteCollector = require("role.remoteCollector"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskDismantle = require("task.dismantle"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    Cleanup = function(supportRoom) {
        RoomObj.call(this);

        this.type = "cleanup";
        this.supportRoom = supportRoom;
    };

Cleanup.prototype = Object.create(RoomObj.prototype);
Cleanup.prototype.constructor = Cleanup;

Cleanup.prototype.run = function(room) {
    "use strict";

    var ramparts = [], structures = [], noEnergyStructures = [], energyStructures = [],
        supportRoom, tasks;

    // Can't see the support room, we have bigger problems, so just bail.
    if (!(supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom])) {
        return;
    }

    // Get the tasks needed for this room.
    tasks = {
        collectEnergy: {
            cleanupTasks: []
        },
        fillEnergy: {
            fillStorageTasks: TaskFillEnergy.getFillStorageTasks(supportRoom),
            fillContainerTasks: TaskFillEnergy.getFillContainerTasks(supportRoom),
            fillLinkTask: TaskFillEnergy.getFillLinkTask(room, supportRoom)
        },
        fillMinerals: {
            fillStorageTasks: TaskFillMinerals.getFillStorageTasks(supportRoom)
        },
        remoteDismantle: {
            cleanupTasks: []
        },
        dismantle: {
            tasks: []
        }
    };

    if (Memory.dismantle && Memory.dismantle[room.name] && Memory.dismantle[room.name].length > 0) {
        _.forEach(Memory.dismantle[room.name], (pos) => {
            var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
            if (structures.length === 0) {
                completed.push(pos);
            } else {
                tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
            }
        });
        _.forEach(completed, (complete) => {
            _.remove(Memory.dismantle[room.name], (d) => d.x === complete.x && d.y === complete.y);
        });
    } else {
        _.forEach(Cache.creepsInRoom("dismantler", room), (creep) => {
            creep.memory.role = "worker";
            creep.memory.home = supportRoom.name
        });
    }

    if (!room.unobservable) {
        // Find all ramparts.
        ramparts = _.filter(room.find(FIND_HOSTILE_STRUCTURES), (s) => s instanceof StructureRampart);

        // Find all structures that aren't under ramparts, divided by whether they have energy or not.
        structures = _.filter(room.find(FIND_HOSTILE_STRUCTURES), (s) => !(s instanceof StructureRampart) && !(s instanceof StructureController) && (ramparts.length === 0 || s.pos.getRangeTo(Utilities.objectsClosestToObj(ramparts, s)[0]) > 0));
        noEnergyStructures = _.filter(structures, (s) => (!s.energy || s.energy === 0) && (!s.store || _.sum(s.store) === 0));
        energyStructures = _.filter(structures, (s) => (s.energy && s.energy > 0) || (s.store && _.sum(s.store) > 0));

        // Collect energy and minerals from structures that aren't under ramparts.
        tasks.collectEnergy.cleanupTasks = TaskCollectEnergy.getCleanupTasks(energyStructures);

        if (noEnergyStructures.length > 0) {
            // Dismantle structures with no energy or minerals that aren't under ramparts.
            tasks.remoteDismantle.cleanupTasks = TaskDismantle.getCleanupTasks(noEnergyStructures);
        } else {
            // Dismantle ramparts.
            tasks.remoteDismantle.cleanupTasks = TaskDismantle.getCleanupTasks(ramparts);
        }

        if (energyStructures.length === 0 && tasks.remoteDismantle.cleanupTasks.length === 0) {
            // Notify that the room is cleaned up.
            Game.notify("Cleanup Room " + room.name + " is squeaky clean!");
            
            // No longer need remote collectors.
            _.forEach(Cache.creepsInRoom("remoteCollector", room), (creep) => {
                creep.memory.role = "storer";
                creep.memory.home = supportRoom.name;
            });

            // No longer need dismantlers.
            _.forEach(Cache.creepsInRoom("remoteDismantler", room), (creep) => {
                creep.memory.role = "upgrader";
                creep.memory.home = supportRoom.name;
            });

            // Eliminate the room from memory.
            Commands.setRoomType(room.name);
        }
    }

    // Spawn new creeps.
    if (room.unobservable || structures.length > 0 || ramparts.length > 0) {
        RoleRemoteDismantler.checkSpawn(room, supportRoom);
    }
    if (Memory.dismantle && Memory.dismantle[room.name] && Memory.dismantle[room.name].length > 0) {
        RoleDismantler.checkSpawn(room, supportRoom);
    }
    if (energyStructures.length > 0) {
        RoleRemoteCollector.checkSpawn(room, supportRoom);
    }

    // Assign tasks to creeps.                    
    RoleRemoteDismantler.assignTasks(room, tasks);
    RoleDismantler.assignTasks(room, tasks);
    RoleRemoteCollector.assignTasks(room, tasks);
};

Cleanup.prototype.toObj = function(room) {
    "use strict";

    Memory.rooms[room.name].roomType = {
        type: this.type,
        supportRoom: this.supportRoom
    }
};

Cleanup.fromObj = function(roomMemory) {
    "use strict";

    return new Cleanup(roomMemory.roomType.supportRoom);
};

require("screeps-profiler").registerObject(Cleanup, "RoomCleanup");
module.exports = Cleanup;
