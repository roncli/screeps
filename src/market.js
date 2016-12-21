var Cache = require("cache"),
    orders = undefined,

    Market = {
        getAllOrders: () => {
            "use strict";

            if (!orders || Game.cpu.bucket >= Memory.marketBucket) {
                if (!orders) {
                    Cache.log.events.push("System reset.")
                }
                orders = Game.market.getAllOrders();
            }
            
            return orders;
        },
        
        deal: (orderId, amount, yourRoomName) => {
            "use strict";
            
            var ret;
            
            if ((ret = Game.market.deal(orderId, amount, yourRoomName)) === OK) {
                let order = _.filter(orders, (m) => m.id === orderId)[0];
                if (order) {
                    if (order.amount <= amount) {
                        _.remove(orders, (m) => m.id === orderId);
                    } else {
                        order.amount -= amount;
                        Cache.log.events.push(order.resource + " x" + amount + " completed, " + order.amount + " remaining.");
                    }
                }
            }
            
            return ret;
        }
    };

require("screeps-profiler").registerObject(Market, "Market");
module.exports = Market;
