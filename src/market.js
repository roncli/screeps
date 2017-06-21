const Cache = require("cache"),
    Utilities = require("utilities");

//  #   #                #              #
//  #   #                #              #
//  ## ##   ###   # ##   #   #   ###   ####
//  # # #      #  ##  #  #  #   #   #   #
//  #   #   ####  #      ###    #####   #
//  #   #  #   #  #      #  #   #       #  #
//  #   #   ####  #      #   #   ###     ##
/**
 * A class for dealing with and caching market data.
 */
class Market {
    //              #     ##   ##    ##     ##            #
    //              #    #  #   #     #    #  #           #
    //  ###   ##   ###   #  #   #     #    #  #  ###    ###   ##   ###    ###
    // #  #  # ##   #    ####   #     #    #  #  #  #  #  #  # ##  #  #  ##
    //  ##   ##     #    #  #   #     #    #  #  #     #  #  ##    #       ##
    // #      ##     ##  #  #  ###   ###    ##   #      ###   ##   #     ###
    //  ###
    /**
     * Gets and caches all of the orders on the market.
     * @return {object[]} All of the orders on the market.
     */
    static getAllOrders() {
        if (!Market.orders || Game.cpu.bucket >= Memory.marketBucket) {
            Market.orders = Game.market.getAllOrders();
            delete Market.filteredOrders;
        }

        return Market.orders;
    }

    //              #    ####   #    ##     #                         #   ##            #
    //              #    #            #     #                         #  #  #           #
    //  ###   ##   ###   ###   ##     #    ###    ##   ###    ##    ###  #  #  ###    ###   ##   ###    ###
    // #  #  # ##   #    #      #     #     #    # ##  #  #  # ##  #  #  #  #  #  #  #  #  # ##  #  #  ##
    //  ##   ##     #    #      #     #     #    ##    #     ##    #  #  #  #  #     #  #  ##    #       ##
    // #      ##     ##  #     ###   ###     ##   ##   #      ##    ###   ##   #      ###   ##   #     ###
    //  ###
    /**
     * Gets all orders on the market filtered by type (buy/sell) and resource type.
     * @return {object} All of the orders on the market, filtered by type and resource type.
     */
    static getFilteredOrders() {
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
    }

    //    #              ##
    //    #               #
    //  ###   ##    ###   #
    // #  #  # ##  #  #   #
    // #  #  ##    # ##   #
    //  ###   ##    # #  ###
    /**
     * Attempt to deal on the market.
     * @param {string} orderId The order ID to fill.
     * @param {number} amount The quantity of the order to fill.
     * @param {string} yourRoomName The room name containing the terminal to deal from.
     * @return {number} The return value from Game.market.deal.
     */
    static deal(orderId, amount, yourRoomName) {
        const ret = Game.market.deal(orderId, amount, yourRoomName),
            order = _.find(Market.orders, (m) => m.id === orderId);

        if (ret === OK) {
            if (order) {
                if (order.type === "sell") {
                    Cache.credits -= order.amount * order.price;
                }
                if (order.amount <= amount) {
                    _.remove(Market.filteredOrders[order.type][order.resourceType], (m) => m.id === orderId);
                    _.remove(Market.orders, (m) => m.id === orderId);
                } else {
                    order.amount -= amount;
                }
            }
        } else if (order) {
            _.remove(Market.filteredOrders[order.type][order.resourceType], (m) => m.id === orderId);
            _.remove(Market.orders, (m) => m.id === orderId);
        }

        return ret;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Market, "Market");
}
module.exports = Market;
