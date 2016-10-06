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
};

module.exports = utilities;
