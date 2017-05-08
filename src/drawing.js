//  ####                          #                 
//   #  #                                           
//   #  #  # ##    ###   #   #   ##    # ##    ## # 
//   #  #  ##  #      #  #   #    #    ##  #  #  #  
//   #  #  #       ####  # # #    #    #   #   ##   
//   #  #  #      #   #  # # #    #    #   #  #     
//  ####   #       ####   # #    ###   #   #   ###  
//                                            #   # 
//                                             ###  
/**
 * A class of static functions to support drawing visuals.
 */
class Drawing {
    //                                                   ###               
    //                                                   #  #              
    // ###   ###    ##    ###  ###    ##    ###    ###   ###    ###  ###   
    // #  #  #  #  #  #  #  #  #  #  # ##  ##     ##     #  #  #  #  #  #  
    // #  #  #     #  #   ##   #     ##      ##     ##   #  #  # ##  #     
    // ###   #      ##   #     #      ##   ###    ###    ###    # #  #     
    // #                  ###                                              
    /**
     * Draw a progress bar on a visual.
     * @param {RoomVisual} visual The RoomVisual object to draw to.
     * @param {number} x The X coordinate of the progress bar.
     * @param {number} y The Y coordinate of the progress bar. 
     * @param {number} w The width of the progress bar.
     * @param {number} h The height of the progress bar.
     * @param {number} value The current value for the progress bar.
     * @param {number} max The maximum value for the progress bar.
     * @param {object} options The options for the progress bar.
     */
    static progressBar(visual, x, y, w, h, value, max, options) {
        if (options.showMax === undefined) {
            options.showMax = true;
        }
        if (options.valueDecimals === undefined) {
            options.valueDecimals = 0;
        }
        visual
            .rect(x, y, w, h, {fill: options.background})
            .rect(x, y, w * Math.min(value / max, 1), h, {fill: options.bar})
            .text(`${options.label ? `${options.label} ` : ""}${value.toFixed(options.valueDecimals)}${options.showMax ? `/${max.toFixed(0)}` : ""}${options.showDetails ? ` (${(100 * value / max).toFixed(3)}%) ${(max - value).toFixed(0)} to go` : ""}`, x + w / 2, y + h / 2 + 0.175, {align: "center", color: options.color, font: options.font});
    }

    // ###    ##    ###    ##   #  #  ###    ##    ##   
    // #  #  # ##  ##     #  #  #  #  #  #  #     # ##  
    // #     ##      ##   #  #  #  #  #     #     ##    
    // #      ##   ###     ##    ###  #      ##    ##   
    /**
     * Draws a graphical representation of a resource.
     * @param {RoomVisual} visual The RoomVisual object to draw to.
     * @param {number} x The X coordinate of the resource.
     * @param {number} y The Y coordinate of the resource. 
     * @param {number} size The size of the resource.
     * @param {string} resource The resource to draw.
     * @param {object} options The options for the resource.
     */
    static resource(visual, x, y, size, resource, options) {
        switch (resource) {
            case RESOURCE_ENERGY:
                visual.circle(x, y, {radius: 0.625 * size / 2, fill: "#FFE664", opacity: options.opacity});
                break;
            case RESOURCE_POWER:
                visual.circle(x, y, {radius: 0.625 * size / 2, fill: "#FF1930", opacity: options.opacity});
                break;
            case RESOURCE_HYDROGEN:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#B4B4B4", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#4C4C4C", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#B4B4B4", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_OXYGEN:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#B4B4B4", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#4C4C4C", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#B4B4B4", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#50D7F9", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#006181", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#50D7F9", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#A071FF", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#371383", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#A071FF", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#00F4A2", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#236144", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#00F4A2", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#FDD388", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#5D4C2E", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#FDD388", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYST:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#FF7B7B", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#592121", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#FF7B7B", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_HYDROXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#B4B4B4", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_KEANITE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#B4B4B4", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_LEMERGITE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#B4B4B4", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM:
                visual
                    .rect(x - size / 2, y - size / 2, size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#666666", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_UTRIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_UTRIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_KEANIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_KEANIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_LEMERGIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_ZYNTHIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_GHODIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_GHODIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
        }
    }

    //                          #     ##     #                
    //                          #      #                      
    //  ###   ###    ###  ###   # #    #    ##    ###    ##   
    // ##     #  #  #  #  #  #  ##     #     #    #  #  # ##  
    //   ##   #  #  # ##  #     # #    #     #    #  #  ##    
    // ###    ###    # #  #     #  #  ###   ###   #  #   ##   
    //        #                                               
    /**
     * Creates a sparkline series, which is a mini line graph.
     * @param {RoomVisual} visual The RoomVisual object to draw to.
     * @param {number} x The X coordinate of the sparkline.
     * @param {number} y The Y coordinate of the sparkline. 
     * @param {number} w The width of the sparkline.
     * @param {number} h The height of the sparkline.
     * @param {object[]} values The series of values for the sparkline.
     * @param {object[]} options The series of options for the sparkline.
     * @example
     * // This draws a sparkline of values from the Memory.status.cpu object.
     * Drawing.sparkline(Cache.globalVisual, 23.5, 1, 18, 2, _.map(Memory.stats.cpu, (v, i) => ({cpu: Memory.stats.cpu[i], bucket: Memory.stats.bucket[i], limit: Game.cpu.limit})), [{key: "limit", min: Game.cpu.limit * 0.5, max: Game.cpu.limit * 1.5, stroke: "#c0c0c0", opacity: 0.25}, {key: "cpu", min: Game.cpu.limit * 0.5, max: Game.cpu.limit * 1.5, stroke: "#ffff00", opacity: 0.5}, {key: "bucket", min: 0, max: 10000, stroke: "#00ffff", opacity: 0.5, font: "0.5 Arial"}]);
     */
    static sparkline(visual, x, y, w, h, values, options) {
        visual.rect(x, y, w, h, {fill: "#404040", opacity: 0.5});
        _.forEach(options, (option) => {
            visual.poly(_.map(values, (v, i) => [x + w * (i / (values.length - 1)), y + h * (1 - (v[option.key] - option.min) / (option.max - option.min))]), option);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Drawing, "Drawing");
}
module.exports = Drawing;
