// Based on implementation at https://github.com/websockets/ws/wiki/Websocket-client-implementation-for-auto-reconnect

const WebSocket = require('ws');

function WebSocketClient(){
    this.number = 0;    // Message number
    this.autoReconnectInterval = 5*1000;    // ms
}
WebSocketClient.prototype.open = function(url){
    this.url = url;
    this.instance = new WebSocket(this.url);
    this.instance.on('open',()=>{
        this.onopen();
    });
    this.instance.on('message',(data,flags,number)=>{
        this.number ++;
        this.onmessage(data,flags,number);
    });
    this.instance.on('close',(e)=>{
        switch (e){
        case 1000:  // CLOSE_NORMAL
            console.log("WebSocket: closed");
            break;
        default:    // Abnormal closure
            this.reconnect(e);
            break;
        }
        this.onclose(e);
    });
    this.instance.on('error',(e)=>{
        switch (e.code){
        case 'ECONNREFUSED':
            this.reconnect(e);
            break;
        default:
            this.onerror(e);
            break;
        }
    });
}
WebSocketClient.prototype.send = function(data,option){
    try{
        this.instance.send(data,option);
    }catch (e){
        this.instance.emit('error',e);
    }
}
WebSocketClient.prototype.reconnect = function(e){
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
    var that = this;
    setTimeout(function(){
        console.log("WebSocketClient: reconnecting...");
        that.open(that.url);
    },this.autoReconnectInterval);
}

module.exports = WebSocketClient;
