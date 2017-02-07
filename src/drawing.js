var Drawing = {
    progressBar: (room, x, y, h, w, value, max, options) => {
        if (options.showMax === undefined) {
            options.showMax = true;
        }
        room.visual
            .rect(x, y, h, w, {fill: options.background})
            .rect(x, y, w * value / max, h, {fill: options.bar})
            .text((options.label ? options.label + " " : "") + value.toFixed(0) + (options.showMax ? "/" + max.toFixed(0) : "") + (options.showDetails ? " (" + (100 * value / max).toFixed(3) + "%) " + (max - value).toFixed(0) + " to go" : ""), x + w / 2, y + h / 2 - 0.25, {align: "center", color: options.color});
    }
};

require("screeps-profiler").registerObject(Drawing, "Drawing");
module.exports = Drawing;
