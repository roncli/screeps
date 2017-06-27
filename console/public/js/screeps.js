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
            ws.send("init");
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
                    Screeps.loadBases();

                    break;
                case "stats":
                    ({stats: data.stats} = message);

                    Screeps.loadGeneral();

                    break;
                case "creepCounts":
                    ({creepCounts: data.creepCounts} = message);

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

        const {0: general} = $("#general"),
            {stats: {cpu: cpuHistory, bucket: bucketHistory}, survey, survey: {data: {global, global: {gcl, cpu}, rooms}}} = data;
        
        general.cpu = cpu;
        ({[bucketHistory.length - 1]: general.currentBucket} = bucketHistory);
        ({[cpuHistory.length - 1]: general.currentCpu} = cpuHistory);
        general.gcl = gcl;
        general.global = global;
        general.survey = survey;
    }

    static loadBases() {
        if (!data.survey || !data.creepCounts) {
            return;
        }

        const {stats: {cpu: cpuHistory, bucket: bucketHistory}, survey, survey: {data: surveyData, data: {global, global: {gcl, cpu}, rooms}}} = data,
            $base = $(document.importNode($($($("#base-import")[0].import).find("#base-template")[0].content)[0], true));

        
    }
}

$(document).ready(Screeps.createWebsocketClient);
