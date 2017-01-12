var Cache = require("cache"),
    resourcesAvailable,

    Market = {
        getAllOrders: () => {
            "use strict";

            if (!Market.orders || Game.cpu.bucket >= Memory.marketBucket) {
                Market.orders = Game.market.getAllOrders();
            }
            
            return Market.orders;
        },
        
        deal: (orderId, amount, yourRoomName) => {
            "use strict";
            
            var ret = Game.market.deal(orderId, amount, yourRoomName);
            
            if (ret === OK) {
                let index = _.findIndex(Market.orders, (m) => m.id === orderId);
                if (index !== -1) {
                    let order = Market.orders[index];
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
        },
        
        resourcesAvailable: () => {
            return resourcesAvailable ? resourcesAvailable : (resourcesAvailable = _.uniq(_.map(Market.getAllOrders(), (o) => o.resourceType)));
        }
    };

require("screeps-profiler").registerObject(Market, "Market");
module.exports = Market;
