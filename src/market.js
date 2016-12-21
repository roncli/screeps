var Cache = require("cache"),

    Market = {
        getAllOrders: () => {
            "use strict";

            if (!Market.orders || Game.cpu.bucket >= Memory.marketBucket) {
                if (!Market.orders) {
                    Cache.log.events.push("System reset.")
                }
                Market.orders = Game.market.getAllOrders();
            }
            
            return Market.orders;
        },
        
        deal: (orderId, amount, yourRoomName) => {
            "use strict";
            
            var ret;
            
            if ((ret = Game.market.deal(orderId, amount, yourRoomName)) === OK) {
                let order = _.filter(Market.orders, (m) => m.id === orderId)[0];
                if (order) {
                    if (order.amount <= amount) {
                        Cache.log.events.push(yourRoomName + " " + order.resourceType + " x" + amount + " @ " +  order.price + " completed, " + order.type + " sold out " + order.id)
                        _.remove(Market.orders, (m) => m.id === orderId);
                    } else {
                        order.amount -= amount;
                        Cache.log.events.push(yourRoomName + " " + order.resourceType + " x" + amount + " @ " +  order.price + " completed, " + order.type + " " + order.amount + " remaining on " + order.id);
                    }
                }
            }
            
            return ret;
        }
    };

require("screeps-profiler").registerObject(Market, "Market");
module.exports = Market;
