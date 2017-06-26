const Minerals =
    {
        H: {name: "Hydrogen", description: ""},
        O: {name: "Oxygen", description: ""},
        U: {name: "Utrium", description: ""},
        L: {name: "Lemergium", description: ""},
        K: {name: "Keanium", description: ""},
        Z: {name: "Zynthium", description: ""},
        X: {name: "Catalyst", description: ""},
        G: {name: "Ghodium", description: "Needed for nukes and creating safe mode charges."},
        OH: {name: "Hydroxide", description: ""},
        ZK: {name: "Zynthium Keanite", description: ""},
        UL: {name: "Utrium Lemergite", description: ""},
        UH: {name: "Utrium Hydride", description: ""},
        UO: {name: "Utrium Oxide", description: ""},
        KH: {name: "Keanium Hydride", description: ""},
        KO: {name: "Keanium Oxide", description: ""},
        LH: {name: "Lemergium Hydride", description: ""},
        LO: {name: "Lemergium Oxide", description: ""},
        ZH: {name: "Zynthium Hydride", description: ""},
        ZO: {name: "Zynthium Oxide", description: ""},
        GH: {name: "Ghodium Hydride", description: ""},
        GO: {name: "Ghodium Oxide", description: ""},
        UH2O: {name: "Utrium Acid", description: ""},
        UHO2: {name: "Utrium Alkalide", description: ""},
        KH2O: {name: "Keanium Acid", description: ""},
        KHO2: {name: "Keanium Alkalide", description: ""},
        LH2O: {name: "Lemergium Acid", description: ""},
        LHO2: {name: "Lemergium Alkalide", description: ""},
        ZH2O: {name: "Zynthium Acid", description: ""},
        ZHO2: {name: "Zynthium Alkalide", description: ""},
        GH2O: {name: "Ghodium Acid", description: ""},
        GHO2: {name: "Ghodium Alkalide", description: ""},
        XUH2O: {name: "Catalyzed Utrium Acid", description: ""},
        XUHO2: {name: "Catalyzed Utrium Alkalide", description: ""},
        XKH2O: {name: "Catalyzed Keanium Acid", description: ""},
        XKHO2: {name: "Catalyzed Keanium Alkalide", description: ""},
        XLH2O: {name: "Catalyzed Lemergium Acid", description: ""},
        XLHO2: {name: "Catalyzed Lemergium Alkalide", description: ""},
        XZH2O: {name: "Catalyzed Zynthium Acid", description: ""},
        XZHO2: {name: "Catalyzed Zynthium Alkalide", description: ""},
        XGH2O: {name: "Catalyzed Ghodium Acid", description: ""},
        XGHO2: {name: "Catalyzed Ghodium Alkalide", description: ""}
    },
    data = {messages: []};
let ws;

class Screeps {
    static createWebsocketClient() {
        let connected = false;

        ws = new WebSocket(`${config.ws.scheme}${window.location.hostname}:${config.ws.port}`);

        ws.onopen = function() {
            connected = true;
        };

        ws.onclose = function() {
            if (connected) {
                // If the server shut down, attempt to reconnect once.
                setTimeout(Screeps.createWebsocketClient, 1000);
            } else {
                data.offline = true;
            }
        };

        ws.onmessage = function(ev) {
            const message = JSON.parse(ev.data);

            switch (message.message) {
                case "survey":
                    ({survey: data.survey} = message);

                    Screeps.loadGeneral();

                    break;
                case "stats":
                    ({stats: data.stats} = message);

                    Screeps.loadGeneral();

                    break;
                case "error":
                    data.messages.push({
                        date: moment(data.survey.lastTime) || moment(),
                        tick: data.survey.lastPoll,
                        message: `${message.type} ${JSON.stringify(message.data)}`,
                        type: "error"
                    });

                    break;
            }

            data.messages = data.messages.slice(Math.max(data.messages.length - 100, 0));
        };
    }

    static loadGeneral() {
        if (!data.survey || !data.stats) {
            return;
        }

        const {stats: {cpu: cpuHistory, bucket: bucketHistory}, survey, survey: {data: surveyData, data: {global, global: {gcl, cpu}, rooms}}} = data,
            {[cpuHistory.length - 1]: currentCpu} = cpuHistory,
            {[bucketHistory.length - 1]: currentBucket} = bucketHistory,
            $general = $(document.importNode($($($("#general-import")[0].import).find("#general-template")[0].content)[0], true));

        $general.find("#gcl").text(gcl.level);
        $general.find("#gcl-progress-bar").attr({
            "aria-valuenow": gcl.progress,
            "aria-valuemin": 0,
            "aria-valuemax": gcl.progressTotal
        })
            .css({width: `${100 * gcl.progress / gcl.progressTotal}%`});

        $general.find("#gcl-progress").text(`${gcl.progress.toFixed(0)}/${gcl.progressTotal.toFixed(0)} (${(100 * gcl.progress / gcl.progressTotal).toFixed(3)}%) ${(gcl.progressTotal - gcl.progress).toFixed(0)} to go`);

        $general.find("#cpu-progress-bar").attr({
            "aria-valuenow": currentCpu,
            "aria-valuemin": 0,
            "aria-valuemax": cpu.limit
        })
            .addClass(currentCpu < cpu.limit ? "progress-bar-success" : "progress-bar-danger")
            .css({width: `${Math.min(100 * currentCpu / cpu.limit, 100)}%`});

        $general.find("#cpu").text(`${currentCpu.toFixed(2)}/${cpu.limit.toFixed(0)}`);

        $general.find("#bucket-progress-bar").attr({
            "aria-valuenow": currentBucket,
            "aria-valuemin": 0,
            "aria-valuemax": 10000
        })
            .addClass(currentBucket > 9900 ? "progress-bar-info" : currentBucket > 9000 ? "progress-bar-success" : currentBucket > 5000 ? "progress-bar-warning" : "progress-bar-danger")
            .css({width: `${100 * currentBucket / 10000}%`});

        $general.find("#bucket").text(currentBucket);
        $general.find("#tick-limit").text(cpu.tickLimit);
        $general.find("#credits").text(global.credits.toFixed(2));
        $general.find("#date").text(moment(survey.lastTime).format("M/D/YYYY h:mm:ss a"));
        $general.find("#tick").text(survey.lastPoll);
        $general.find("#creeps-count").text(surveyData.creeps.length);

        rooms.filter((r) => r.type === "base").forEach((room) => {
            const $generalRoom = $(document.importNode($($($("#general-import")[0].import).find("#general-room")[0].content)[0], true));

            $generalRoom.find("#room-summary-name").text(room.name);
            $generalRoom.find("#room-summary-level").text(room.controller && room.controller.level || "n/a");
            $generalRoom.find("#room-summary-storage").css({display: room.storage && room.storage.energy !== void 0 ? "initial" : "none"});
            $generalRoom.find("#room-summary-storage-energy").text(room.storage.energy);
            $generalRoom.find("#room-summary-terminal").css({display: room.terminal && room.terminal.energy !== void 0 ? "initial" : "none"});
            $generalRoom.find("#room-summary-terminal-energy").text(room.terminal.energy);
            $generalRoom.find("#room-summary-rcl-progress-div").css({display: room.controller && room.controller.progress ? "initial" : "none"});
            if (room.controller && room.controller.progress) {
                $generalRoom.find("#room-summary-rcl-progress-bar").attr({
                    "aria-valuenow": room.controller.progress,
                    "aria-valuemin": 0,
                    "aria-valuemax": room.controller.progressTotal
                })
                    .css({width: `${100 * room.controller.progress / room.controller.progressTotal}%`});
                $generalRoom.find("#room-summary-rcl-progress").text(`${room.controller.progress.toFixed(0)}/${room.controller.progressTotal.toFixed(0)} (${(100 * room.controller.progress / room.controller.progressTotal).toFixed(3)}%) ${(room.controller.progressTotal - room.controller.progress).toFixed(0)} to go`);
            }
            $generalRoom.find("#room-summary-separator").css({display: room.controller && room.controller.progress ? "none" : "initial"});
            $generalRoom.find("#room-summary-ttd").css({display: room.controller && room.controller.ticksToDowngrade ? "initial" : "none"});
            $generalRoom.find("#room-summary-ticks").text(room.controller && room.controller.ticksToDowngrade);

            $general.find("#general-rooms").append($generalRoom);
        });

        $("#general").empty()
            .append($general);
    }
}

$(document).ready(Screeps.createWebsocketClient);
