var Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    RoleRemoteDismantler = require("role.remoteDismantler"),
    RoleRemoteCollector = require("role.remoteCollector"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskDismantle = require("task.dismantle"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskPickupResource = require("task.pickupResource");

    Cleanup = function(supportRoom) {
        "use strict";
    
        this.init(supportRoom);
    };

Cleanup.prototype.init = function(supportRoom) {
    "use strict";
    
    this.type = "cleanup";
    this.supportRoom = supportRoom;
};

Cleanup.prototype.run = function(room) {
    "use strict";

    var roomName = room.name,
        ramparts = [], structures = [], noEnergyStructures = [], energyStructures = [], completed = [], junk = [],
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

    if (!room.unobservable) {
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
            // Notify that the room is cleaned up.
            Game.notify(`Cleanup Room ${room.name} is squeaky clean!`);
            
            // No longer need remote collectors.
            _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].remoteCollector || [], (creep) => {
                creep.memory.role = "storer";
                creep.memory.home = supportRoom.name;
            });

            // No longer need dismantlers.
            _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].remoteDismantler || [], (creep) => {
                creep.memory.role = "upgrader";
                creep.memory.home = supportRoom.name;
            });

            // Eliminate the room from memory.
            Commands.setRoomType(room.name);
        }
    }

    // Spawn new creeps.
    if (room.unobservable || structures.length > 0 || ramparts.length > 0 || junk.length > 0) {
        RoleRemoteDismantler.checkSpawn(room, supportRoom, Math.min(structures.length + ramparts.length + junk.length, 8));
    }
    RoleRemoteCollector.checkSpawn(room, supportRoom, (tasks.collectEnergy.cleanupTasks > 0 || tasks.collectMinerals.cleanupTasks) ? (supportRoom.controller ? supportRoom.controller.level : 3) : 1);

    // Assign tasks to creeps.                    
    RoleRemoteDismantler.assignTasks(room, tasks);
    RoleRemoteCollector.assignTasks(room, tasks);
};

Cleanup.prototype.toObj = function(room) {
    "use strict";

    Memory.rooms[room.name].roomType = {
        type: this.type,
        supportRoom: this.supportRoom
    };
};

Cleanup.fromObj = function(roomMemory) {
    "use strict";

    return new Cleanup(roomMemory.roomType.supportRoom);
};

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Cleanup, "RoomCleanup");
}
module.exports = Cleanup;
