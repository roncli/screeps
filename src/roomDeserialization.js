var Cache = require("cache"),
    RoomBase = require("room.base"),
    RoomCleanup = require("room.cleanup"),
    RoomMine = require("room.mine"),
    RoomSource = require("room.source"),
    
    deserialization = (roomMemory, name) => {
        "use strict";

        switch (roomMemory.roomType.type) {
            case "base":
                Cache.roomTypes[name] = RoomBase.fromObj(roomMemory);
                break;
            case "cleanup":
                Cache.roomTypes[name] = RoomCleanup.fromObj(roomMemory);
                break;
            case "mine":
                Cache.roomTypes[name] = RoomMine.fromObj(roomMemory);
                break;
            case "source":
                Cache.roomTypes[name] = RoomSource.fromObj(roomMemory);
                break;
        }
    };

require("screeps-profiler").registerObject(deserialization, "RoomDeserialization");
module.exports = deserialization;
