var express = require('express'),
    WebSocketServer = require('ws').Server,
    app = express(),
    wss = new WebSocketServer({port: 8080}),
    clients = [];

// ROUTING
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));

app.get('/', function(req, res){
    res.sendfile('views/index.html');
});
app.get('/scoreboard', function(req, res){
    res.sendfile('views/scoreboard.html');
});
app.get('/control', function(req, res){
    res.sendfile('views/control.html');
});

app.listen(process.env.PORT || 5000);


// SOCKETS
wss.on('connection', function(ws) {
    clients.push({socket: ws, clientType: null});
    ws.on('message', function(message) {
        console.log('received: %s', message);
        message = JSON.parse(message);

        // check if it is a new actor
        if (message.clientType){
            clients[clients.length - 1].clientType = message.clientType;
        }

        //
        if (message.action){
            switch (message.action){
                case 'addScore':
                    console.log('adding score...');
                    updateScore(message.amount);
                    break;

                case 'addPenalty':
                    updateScore(-message.amount);
                    break;
            }
        }
    });
});

function updateScore(amount){
    var i;

    for (i=0; i < clients.length; i++){
        if (clients[i].clientType === 'scoreboard'){
            clients[i].socket.send('Adding ' + amount + 'point(s).');
        }
    }
}