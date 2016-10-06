var utilities = {
    creepsWithTask: (creeps, task) => {
        return _.filter(creeps, (c) => c.memory.currentTask && _.isMatch(c.memory.currentTask, task));
    },

    creepsWithNoTask: (creeps) => {
        return _.filter(creeps, (c) => !c.memory.currentTask);
    },

    objectsClosestToObj: (objects, obj) => {
        if (objects.length === 0) {
            return [];
        }

        if (!obj) {
            return objects;
        }
        
        var objList = _.map(objects, (o) => {
            return {
                object: o,
                distance: obj.pos.getRangeTo(o)
            };
        });
        
        objList.sort((a, b) => {
            return a.distance - b.distance;
        });
        
        return _.map(objList, (o) => o.object);
    },

    getEmptyPosAroundPos: (pos) => {
        var count = 0,
            x, y, checkPos;

        for (x = pos.x - 1; x < pos.x + 2; x++) {
            for (y = pos.y - 1; y < pos.y + 2; y++) {
                // Don't need to check the origin.
                if (x === pos.x && y === pos.y) {
                    break;
                }

                checkPos = new RoomPosition(x, y, pos.roomName);
                if (checkPos) {
                    count += _.filter(checkPos.look(), (o) => o.type === "terrain" && o.type !== "wall").length;
                }
            }
        }

        return count;
    }
};

module.exports = utilities;
