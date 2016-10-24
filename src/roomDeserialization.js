var Cache = require("cache"),
    RoomBase = require("room.base"),
    RoomMine = require("room.mine"),
    
    deserialization = (roomMemory, name) => {
        "use strict";

        switch (roomMemory.roomType.type) {
            case "base":
                Cache.roomTypes[name] = RoomBase.fromObj(roomMemory);
                break;
            case "mine":
                Cache.roomTypes[name] = RoomMine.fromObj(roomMemory);
                break;
        }
    };

require("screeps-profiler").registerObject(deserialization, "RoomDeserialization");
module.exports = deserialization;
