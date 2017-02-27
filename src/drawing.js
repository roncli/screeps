var Drawing = {
    progressBar: (room, x, y, w, h, value, max, options) => {
        if (options.showMax === undefined) {
            options.showMax = true;
        }
        if (options.valueDecimals === undefined) {
            options.valueDecimals = 0;
        }
        visual
            .rect(x, y, w, h, {fill: options.background})
            .rect(x, y, w * Math.min(value / max, 1), h, {fill: options.bar})
            .text((options.label ? options.label + " " : "") + value.toFixed(options.valueDecimals) + (options.showMax ? "/" + max.toFixed(0) : "") + (options.showDetails ? " (" + (100 * value / max).toFixed(3) + "%) " + (max - value).toFixed(0) + " to go" : ""), x + w / 2, y + h / 2 + 0.25, {align: "center", color: options.color});
    },

    sparkline: (visual, x, y, w, h, values, options) => {
        _.forEach(options, (option) => {
            room.poly(_.map(values, (v, i) => [x + w * (i / (values.length - 1)), y + h * (1 - (v[option.key] - option.min) / (option.max - option.min))]), option);
        });
    },

    resource: (room, x, y, size, resource, style) => {
        switch (resource) {
            case RESOURCE_ENERGY:
                visual.circle(x, y, {radius: 0.625 * size / 2, fill: "#FFE664", opacity: style.opacity});
                break;
            case RESOURCE_POWER:
                visual.circle(x, y, {radius: 0.625 * size / 2, fill: "#FF1930", opacity: style.opacity});
                break;
            case RESOURCE_HYDROGEN:
                visual.circle(x, y, {radius: 0.4375 * size, fill: "#B4B4B4", opacity: style.opacity});
                visual.circle(x, y, {radius: 0.375 * size, fill: "#4C4C4C", opacity: style.opacity});
                visual.text("H", x, y + 0.225 * size, {color: "#B4B4B4", size: 0.625 * size, opacity: style.opacity});
                break;
            case RESOURCE_OXYGEN:
                visual.circle(x, y, {radius: 0.4375 * size, fill: "#B4B4B4", opacity: style.opacity});
                visual.circle(x, y, {radius: 0.375 * size, fill: "#4C4C4C", opacity: style.opacity});
                visual.text("O", x, y + 0.225 * size, {color: "#B4B4B4", size: 0.625 * size, opacity: style.opacity});
                break;
            case RESOURCE_UTRIUM:
                visual.circle(x, y, {radius: 0.4375 * size, fill: "#50D7F9", opacity: style.opacity});
                visual.circle(x, y, {radius: 0.375 * size, fill: "#006181", opacity: style.opacity});
                visual.text("U", x, y + 0.225 * size, {color: "#50D7F9", size: 0.625 * size, opacity: style.opacity});
                break;
            case RESOURCE_KEANIUM:
                visual.circle(x, y, {radius: 0.4375 * size, fill: "#A071FF", opacity: style.opacity});
                visual.circle(x, y, {radius: 0.375 * size, fill: "#371383", opacity: style.opacity});
                visual.text("K", x, y + 0.225 * size, {color: "#A071FF", size: 0.625 * size, opacity: style.opacity});
                break;
            case RESOURCE_LEMERGIUM:
                visual.circle(x, y, {radius: 0.4375 * size, fill: "#00F4A2", opacity: style.opacity});
                visual.circle(x, y, {radius: 0.375 * size, fill: "#236144", opacity: style.opacity});
                visual.text("L", x, y + 0.225 * size, {color: "#00F4A2", size: 0.625 * size, opacity: style.opacity});
                break;
            case RESOURCE_ZYNTHIUM:
                visual.circle(x, y, {radius: 0.4375 * size, fill: "#FDD388", opacity: style.opacity});
                visual.circle(x, y, {radius: 0.375 * size, fill: "#5D4C2E", opacity: style.opacity});
                visual.text("Z", x, y + 0.225 * size, {color: "#FDD388", size: 0.625 * size, opacity: style.opacity});
                break;
            case RESOURCE_CATALYST:
                visual.circle(x, y, {radius: 0.4375 * size, fill: "#FF7B7B", opacity: style.opacity});
                visual.circle(x, y, {radius: 0.375 * size, fill: "#592121", opacity: style.opacity});
                visual.text("X", x, y + 0.225 * size, {color: "#FF7B7B", size: 0.625 * size, opacity: style.opacity});
                break;
            case RESOURCE_HYDROXIDE:
                visual.rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#B4B4B4", opacity: style.opacity});
                visual.text("OH", x + 0.1875 * size, y + 0.225 * size, {color: "#666666", size: 0.625 * size, opacity: style.opacity});
                break;
            case RESOURCE_ZYNTHIUM_KEANITE:
                break;
            case RESOURCE_UTRIUM_LEMERGITE:
                break;
            case RESOURCE_GHODIUM:
                break;
            case RESOURCE_UTRIUM_HYDRIDE:
                break;
            case RESOURCE_UTRIUM_OXIDE:
                break;
            case RESOURCE_KEANIUM_HYDRIDE:
                break;
            case RESOURCE_KEANIUM_OXIDE:
                break;
            case RESOURCE_LEMERGIUM_HYDRIDE:
                break;
            case RESOURCE_LEMERGIUM_OXIDE:
                break;
            case RESOURCE_ZYNTHIUM_HYDRIDE:
                break;
            case RESOURCE_ZYNTHIUM_OXIDE:
                break;
            case RESOURCE_GHODIUM_HYDRIDE:
                break;
            case RESOURCE_GHODIUM_OXIDE:
                break;
            case RESOURCE_UTRIUM_ACID:
                break;
            case RESOURCE_UTRIUM_ALKALIDE:
                break;
            case RESOURCE_KEANIUM_ACID:
                break;
            case RESOURCE_KEANIUM_ALKALIDE:
                break;
            case RESOURCE_LEMERGIUM_ACID:
                break;
            case RESOURCE_LEMERGIUM_ALKALIDE:
                break;
            case RESOURCE_ZYNTHIUM_ACID:
                break;
            case RESOURCE_ZYNTHIUM_ALKALIDE:
                break;
            case RESOURCE_GHODIUM_ACID:
                break;
            case RESOURCE_GHODIUM_ALKALIDE:
                break;
            case RESOURCE_CATALYZED_UTRIUM_ACID:
                break;
            case RESOURCE_CATALYZED_UTRIUM_ALKALIDE:
                break;
            case RESOURCE_CATALYZED_KEANIUM_ACID:
                break;
            case RESOURCE_CATALYZED_KEANIUM_ALKALIDE:
                break;
            case RESOURCE_CATALYZED_LEMERGIUM_ACID:
                break;
            case RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE:
                break;
            case RESOURCE_CATALYZED_ZYNTHIUM_ACID:
                break;
            case RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE:
                break;
            case RESOURCE_CATALYZED_GHODIUM_ACID:
                break;
            case RESOURCE_CATALYZED_GHODIUM_ALKALIDE:
                break;
        }
    }
};

require("screeps-profiler").registerObject(Drawing, "Drawing");
module.exports = Drawing;
