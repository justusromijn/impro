var socket = new WebSocket("ws://localhost:8080");


socket.onopen = function(){
    console.log("Socket has been opened!");
};

socket.onmessage = function(msg){
    console.log(msg);	//Awesome!
};
