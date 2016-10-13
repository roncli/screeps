var Cache = require("cache"),
    RoomBase = require("room.base");
    
    deserialization = (roomMemory, name) => {
        "use strict";

        switch (roomMemory.roomType.type) {
            case "base":
                Cache.roomTypes[name] = RoomBase.fromObj(roomMemory);
                break;
        }
    };

require("screeps-profiler").registerObject(deserialization, "RoomDeserialization");
module.exports = deserialization;
