var $jscomp={scope:{},findInternal:function(a,c,b){a instanceof String&&(a=String(a));for(var d=a.length,e=0;e<d;e++){var f=a[e];if(c.call(b,f,e,a))return{i:e,v:f}}return{i:-1,v:void 0}}};$jscomp.defineProperty="function"==typeof Object.defineProperties?Object.defineProperty:function(a,c,b){if(b.get||b.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[c]=b.value)};
$jscomp.getGlobal=function(a){return"undefined"!=typeof window&&window===a?a:"undefined"!=typeof global&&null!=global?global:a};$jscomp.global=$jscomp.getGlobal(this);$jscomp.polyfill=function(a,c,b,d){if(c){b=$jscomp.global;a=a.split(".");for(d=0;d<a.length-1;d++){var e=a[d];e in b||(b[e]={});b=b[e]}a=a[a.length-1];d=b[a];c=c(d);c!=d&&null!=c&&$jscomp.defineProperty(b,a,{configurable:!0,writable:!0,value:c})}};
$jscomp.polyfill("Array.prototype.find",function(a){return a?a:function(a,b){return $jscomp.findInternal(this,a,b).v}},"es6-impl","es3");var Task=require("task"),Pathing=require("pathing"),Heal=function(a){this.init(a)};Heal.prototype=Object.create(Task.prototype);Heal.prototype.constructor=Heal;Heal.prototype.init=function(a){Task.call(this);this.type="heal";this.id=a;this.ally=Game.getObjectById(a)};
Heal.prototype.canAssign=function(a,c){if(a.spawning||0===a.getActiveBodyparts(HEAL))return!1;Task.prototype.assign.call(this,a,c);return!0};Heal.prototype.run=function(a){if(this.ally&&this.ally.hits!==this.ally.hitsMax)return a.hits<a.hitsMax&&a.heal(a),a.id!==this.ally.id&&(Pathing.moveTo(a,this.ally),1>=a.pos.getRangeTo(this.ally)?a.heal(this.ally):3>=a.pos.getRangeTo(this.ally)&&a.rangedHeal(this.ally)),Task.prototype.complete.call(this,a),!0;Task.prototype.complete.call(this,a)};
Heal.prototype.toObj=function(a){this.ally?a.memory.currentTask={type:this.type,id:this.ally.id}:delete a.memory.currentTask};Heal.fromObj=function(a){return new Heal(a.memory.currentTask.id)};Heal.getTasks=function(a){return _.map(_.filter(a.find(FIND_MY_CREEPS),function(a){return a.hits<a.hitsMax}).sort(function(a,b){return a.hits-b.hits}),function(a){return new Heal(a.id)})};
Heal.getDefenderTask=function(a){return _.map(_.filter(a.room.find(FIND_MY_CREEPS),function(c){return c.hits<c.hitsMax&&c.id!==a.id}).sort(function(a,b){return a.hits-b.hits}),function(a){return new Heal(a.id)})[0]};require("screeps-profiler").registerObject(Heal,"TaskHeal");module.exports=Heal;