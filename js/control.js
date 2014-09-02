var socket = new WebSocket("ws://localhost:8080");

socket.onopen = function(){
    // register as a juror
    var message = {
        clientType: 'juror'
    };
    socket.send(JSON.stringify(message));
};

socket.onmessage = function(msg){
    console.log(msg);	//Awesome!
};

