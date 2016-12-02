Minerals = {};

Minerals[RESOURCE_HYDROXIDE] = [RESOURCE_HYDROGEN, RESOURCE_OXYGEN];
Minerals[RESOURCE_ZYNTHIUM_KEANITE] = [RESOURCE_ZYNTHIUM, RESOURCE_KEANIUM];
Minerals[RESOURCE_UTRIUM_LEMERGITE] = [RESOURCE_UTRIUM, RESOURCE_LEMERGIUM];
Minerals[RESOURCE_GHODIUM] = [RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE];
Minerals[RESOURCE_UTRIUM_HYDRIDE] = [RESOURCE_UTRIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_UTRIUM_OXIDE] = [RESOURCE_UTRIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_KEANIUM_HYDRIDE] = [RESOURCE_KEANIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_KEANIUM_OXIDE] = [RESOURCE_KEANIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_LEMERGIUM_HYDRIDE] = [RESOURCE_LEMERGIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_LEMERGIUM_OXIDE] = [RESOURCE_LEMERGIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_ZYNTHIUM_HYDRIDE] = [RESOURCE_ZYNTHIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_ZYNTHIUM_OXIDE] = [RESOURCE_ZYNTHIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_GHODIUM_HYDRIDE] = [RESOURCE_GHODIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_GHODIUM_OXIDE] = [RESOURCE_GHODIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_UTRIUM_ACID] = [RESOURCE_UTRIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_UTRIUM_ALKALIDE] = [RESOURCE_UTRIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_KEANIUM_ACID] = [RESOURCE_KEANIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_KEANIUM_ALKALIDE] = [RESOURCE_KEANIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_LEMERGIUM_ACID] = [RESOURCE_LEMERGIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_LEMERGIUM_ALKALIDE] = [RESOURCE_LEMERGIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_ZYNTHIUM_ACID] = [RESOURCE_ZYNTHIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_ZYNTHIUM_ALKALIDE] = [RESOURCE_ZYNTHIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_GHODIUM_ACID] = [RESOURCE_GHODIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_GHODIUM_ALKALIDE] = [RESOURCE_GHODIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_CATALYZED_UTRIUM_ACID] = [RESOURCE_UTRIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_UTRIUM_ALKALIDE] = [RESOURCE_UTRIUM_ALKALIDE, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_KEANIUM_ACID] = [RESOURCE_KEANIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_KEANIUM_ALKALIDE] = [RESOURCE_KEANIUM_ALKALIDE, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_LEMERGIUM_ACID] = [RESOURCE_LEMERGIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] = [RESOURCE_LEMERGIUM_ALKALIDE, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_ZYNTHIUM_ACID] = [RESOURCE_ZYNTHIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] = [RESOURCE_ZYNTHIUM_ALKALIDE, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_GHODIUM_ACID] = [RESOURCE_GHODIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] = [RESOURCE_GHODIUM_ALKALIDE, RESOURCE_CATALYST];

module.exports = Minerals;
