var Cache = require("cache"),
    Utilities = require("utilities"),

    Market = {
        getAllOrders: () => {
            "use strict";

            if (!Market.orders || Game.cpu.bucket >= Memory.marketBucket) {
                Market.orders = Game.market.getAllOrders();
                delete Market.filteredOrders;
            }
            
            return Market.orders;
        },
        
        getFilteredOrders: () => {
            "use strict";

            if (!Market.filteredOrders) {
                Market.filteredOrders = Utilities.nest(_.filter(Market.getAllOrders(), (o) => o.amount > 0), [(d) => d.type, (d) => d.resourceType]);
                _.forEach(Market.filteredOrders.sell, (orders, resource) => {
                    Market.filteredOrders.sell[resource].sort((a, b) => a.price - b.price);
                });
                _.forEach(Market.filteredOrders.buy, (orders, resource) => {
                    Market.filteredOrders.buy[resource].sort((a, b) => b.price - a.price);
                });
            }
            
            return Market.filteredOrders;
        },
        
        deal: (orderId, amount, yourRoomName) => {
            "use strict";
            
            var ret = Game.market.deal(orderId, amount, yourRoomName),
                order = _.find(Market.orders, (m) => m.id === orderId);
            
            if (ret === OK) {
                if (order) {
                    if (order.type === "sell") {
                        Cache.credits -= order.amount * order.price;
                    }
                    if (order.amount <= amount) {
                        Cache.log.events.push(`${yourRoomName} ${order.resourceType} x${amount} @ ${order.price} completed, ${order.type} sold out ${order.id}`);
                        _.remove(Market.filteredOrders[order.type][order.resourceType], (m) => m.id === orderId);
                        _.remove(Market.orders, (m) => m.id === orderId);
                    } else {
                        order.amount -= amount;
                        Cache.log.events.push(`${yourRoomName} ${order.resourceType} x${amount} @ ${order.price} completed, ${order.type} ${order.amount} remaining on ${order.id}`);
                    }
                }
            } else {
                if (order) {
                    Cache.log.events.push(`${yourRoomName} failed to process order ID ${orderId}: ${ret}`);
                    _.remove(Market.filteredOrders[order.type][order.resourceType], (m) => m.id === orderId);
                    _.remove(Market.orders, (m) => m.id === orderId);
                }
            }
            
            return ret;
        }
    };

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Market, "Market");
}
module.exports = Market;
