var $jscomp={scope:{},findInternal:function(a,b,c){a instanceof String&&(a=String(a));for(var d=a.length,e=0;e<d;e++){var f=a[e];if(b.call(c,f,e,a))return{i:e,v:f}}return{i:-1,v:void 0}}};$jscomp.defineProperty="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(c.get||c.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)};
$jscomp.getGlobal=function(a){return"undefined"!=typeof window&&window===a?a:"undefined"!=typeof global&&null!=global?global:a};$jscomp.global=$jscomp.getGlobal(this);$jscomp.polyfill=function(a,b,c,d){if(b){c=$jscomp.global;a=a.split(".");for(d=0;d<a.length-1;d++){var e=a[d];e in c||(c[e]={});c=c[e]}a=a[a.length-1];d=c[a];b=b(d);b!=d&&null!=b&&$jscomp.defineProperty(c,a,{configurable:!0,writable:!0,value:b})}};
$jscomp.polyfill("Array.prototype.find",function(a){return a?a:function(a,c){return $jscomp.findInternal(this,a,c).v}},"es6-impl","es3");
var RoomObj=require("roomObj"),Cache=require("cache"),Commands=require("commands"),Utilities=require("utilities"),RoleDefender=require("role.defender"),RoleDismantler=require("role.dismantler"),RoleHealer=require("role.healer"),RoleRemoteBuilder=require("role.remoteBuilder"),RoleRemoteCollector=require("role.remoteCollector"),RoleRemoteMiner=require("role.remoteMiner"),RoleRemoteStorer=require("role.remoteStorer"),RoleRemoteWorker=require("role.remoteWorker"),TaskBuild=require("task.build"),TaskDismantle=
require("task.dismantle"),TaskFillEnergy=require("task.fillEnergy"),TaskFillMinerals=require("task.fillMinerals"),Source=function(a,b){this.init(a,b)};Source.prototype=Object.create(RoomObj.prototype);Source.prototype.constructor=Source;Source.prototype.init=function(a,b){RoomObj.call(this);this.type="source";this.supportRoom=a;this.stage=b||1};
Source.prototype.stage1Tasks=function(a,b){b={fillEnergy:{storageTasks:TaskFillEnergy.getStorageTasks(b),containerTasks:TaskFillEnergy.getContainerTasks(b)},fillMinerals:{storageTasks:TaskFillMinerals.getStorageTasks(b),terminalTasks:TaskFillMinerals.getTerminalTasks(b)},dismantle:{tasks:[]}};a.unobservable||(b.build={tasks:TaskBuild.getTasks(a)});return b};
Source.prototype.stage1Spawn=function(a){var b=a.name;RoleDefender.checkSpawn(a);RoleHealer.checkSpawn(a);Cache.creeps[b]&&Cache.creeps[b].defender&&0!==_.filter(Cache.creeps[b].defender,function(a){return!a.spawning}).length&&RoleRemoteBuilder.checkSpawn(a)};
Source.prototype.stage1AssignTasks=function(a,b){RoleDefender.assignTasks(a,b);RoleHealer.assignTasks(a,b);RoleRemoteBuilder.assignTasks(a);RoleRemoteMiner.assignTasks(a,b);RoleRemoteWorker.assignTasks(a,b);RoleRemoteStorer.assignTasks(a,b);RoleRemoteCollector.assignTasks(a,b);RoleDismantler.assignTasks(a,b)};
Source.prototype.stage1Manage=function(a,b){var c=b.name,d,e,f,g;a.unobservable||(d=[].concat.apply([],[a.find(FIND_SOURCES),a.find(FIND_MINERALS)]),e=Cache.containersInRoom(a),f=a.name,e.length===d.length?(this.stage=2,_.forEach(e,function(b){var c=Utilities.objectsClosestToObj([].concat.apply([],[d,a.find(FIND_MINERALS)]),b)[0];if(!(c instanceof Mineral))return _.forEach(Cache.creeps[f]&&Cache.creeps[f].remoteBuilder||[],function(a){a.memory.role="remoteWorker";a.memory.container=Utilities.objectsClosestToObj(e,
c)[0].id}),!1})):(g=a.find(FIND_MY_CONSTRUCTION_SITES),0===g.length&&_.forEach(d,function(c){var d=PathFinder.search(c.pos,{pos:Cache.spawnsInRoom(b)[0].pos,range:1},{swampCost:1}).path[0];0===_.filter(d.lookFor(LOOK_STRUCTURES),function(a){return a.structureType===STRUCTURE_CONTAINER}).length&&0===_.filter(g,function(a){return a.pos.x===d.x&&a.pos.y===d.y&&a.structureType===STRUCTURE_CONTAINER}).length&&a.createConstructionSite(d.x,d.y,STRUCTURE_CONTAINER)}),0<_.filter(Cache.hostilesInRoom(a),function(a){return a.owner&&
"Invader"===a.owner.username}).length?Memory.army[f+"-defense"]||Commands.createArmy(f+"-defense",{reinforce:!1,region:a.memory.region,boostRoom:void 0,buildRoom:c,stageRoom:c,attackRoom:f,dismantle:[],dismantler:{maxCreeps:0,units:20},healer:{maxCreeps:2,units:17},melee:{maxCreeps:2,units:20},ranged:{maxCreeps:0,units:20}}):Memory.army[f+"-defense"]&&(Memory.army[f+"-defense"].directive="attack",Memory.army[f+"-defense"].success=!0)))};
Source.prototype.stage1=function(a,b){var c=this.stage1Tasks(a,b);this.stage1Spawn(a);this.stage1AssignTasks(a,c);this.stage1Manage(a,b)};
Source.prototype.stage2Manage=function(a,b){var c=a.name;b=b.name;if(a.unobservable)0===(Cache.creeps[c]&&Cache.creeps[c].remoteMiner||[]).length&&0===(Cache.creeps[c]&&Cache.creeps[c].remoteWorker||[]).length&&0===(Cache.creeps[c]&&Cache.creeps[c].remoteStorer||[]).length&&(this.stage=1);else{var d=[].concat.apply([],[a.find(FIND_SOURCES),a.find(FIND_MINERALS)]);Cache.containersInRoom(a).length!==d.length&&(this.stage=1);0<_.filter(Cache.hostilesInRoom(a),function(a){return a.owner&&"Invader"===
a.owner.username}).length?Memory.army[c+"-defense"]||Commands.createArmy(c+"-defense",{reinforce:!1,region:a.memory.region,boostRoom:void 0,buildRoom:b,stageRoom:b,attackRoom:c,dismantle:[],dismantler:{maxCreeps:0,units:20},healer:{maxCreeps:2,units:17},melee:{maxCreeps:2,units:20},ranged:{maxCreeps:0,units:20}}):Memory.army[c+"-defense"]&&(Memory.army[c+"-defense"].directive="attack",Memory.army[c+"-defense"].success=!0)}};
Source.prototype.stage2Spawn=function(a,b){var c=a.name,d=Memory.dismantle;RoleDefender.checkSpawn(a);RoleHealer.checkSpawn(a);Cache.creeps[c]&&Cache.creeps[c].defender&&0!==_.filter(Cache.creeps[c].defender,function(a){return!a.spawning}).length&&(RoleRemoteMiner.checkSpawn(a),RoleRemoteWorker.checkSpawn(a),RoleRemoteStorer.checkSpawn(a),RoleRemoteCollector.checkSpawn(a,b),d&&d[c]&&0<d[c].length&&RoleDismantler.checkSpawn(a,b))};
Source.prototype.stage2Tasks=function(a,b){var c=a.name,d=0<Utilities.creepsWithNoTask(Cache.creeps[c]&&Cache.creeps[c].remoteWorker||[]).length||0<Utilities.creepsWithNoTask(Cache.creeps[c]&&Cache.creeps[c].remoteStorer||[]).length||0<Utilities.creepsWithNoTask(Cache.creeps[c]&&Cache.creeps[c].remoteDismantler||[]).length;tasks={fillEnergy:{storageTasks:d?TaskFillEnergy.getStorageTasks(b):[],containerTasks:d?TaskFillEnergy.getContainerTasks(b):[]},fillMinerals:{storageTasks:d?TaskFillMinerals.getStorageTasks(b):
[],terminalTasks:d?TaskFillMinerals.getTerminalTasks(b):[]}};if(!a.unobservable){var e=Memory.dismantle;tasks.dismantle={tasks:[]};if(e&&e[c]&&0<e[c].length){var f=[];_.forEach(e[c],function(b){var c=a.lookForAt(LOOK_STRUCTURES,b.x,b.y);0===c.length?f.push(b):tasks.dismantle.tasks=tasks.dismantle.tasks.concat(_.map(c,function(a){return new TaskDismantle(a.id)}))});_.forEach(f,function(a){_.remove(e[c],function(b){return b.x===a.x&&b.y===a.y})})}else _.forEach(Cache.creeps[c]&&Cache.creeps[c].dismantler||
[],function(b){b.memory.role="remoteWorker";b.memory.container=Cache.containersInRoom(a)[0].id})}return tasks};Source.prototype.stage2AssignTasks=function(a,b){RoleDefender.assignTasks(a,b);RoleHealer.assignTasks(a,b);RoleRemoteMiner.assignTasks(a,b);RoleRemoteWorker.assignTasks(a,b);RoleRemoteStorer.assignTasks(a,b);RoleRemoteCollector.assignTasks(a,b);RoleDismantler.assignTasks(a,b)};
Source.prototype.stage2=function(a,b){this.stage2Manage(a,b);1!==this.stage&&(a.unobservable||this.stage2Spawn(a,b),b=this.stage2Tasks(a,b),this.stage2AssignTasks(a,b))};Source.prototype.run=function(a){var b;if(a.unobservable||0!==a.find(FIND_SOURCES).length)if(b=Game.rooms[Memory.rooms[a.name].roomType.supportRoom])a.controller&&a.controller.my?this.convert(a,b):(1===this.stage&&this.stage1(a,b),2===this.stage&&this.stage2(a,b))};
Source.prototype.toObj=function(a){Memory.rooms[a.name].roomType={type:this.type,supportRoom:this.supportRoom,stage:this.stage}};Source.fromObj=function(a){return new Source(a.roomType.supportRoom,a.roomType.stage)};require("screeps-profiler").registerObject(Source,"RoomSource");module.exports=Source;