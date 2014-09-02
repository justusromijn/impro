var express = require('express'),
    WebSocketServer = require('ws').Server,
    app = express(),
    wss = new WebSocketServer({port: 8080}),
    clients = [],
    lusca = require('lusca');

// SECURITY
app.use(lusca({
    //csrf: true,
    csp: { reportOnly: true },
    xframe: 'SAMEORIGIN',
    hsts: {maxAge: 31536000, includeSubDomains: true},
    xssProtection: true
}));

// ROUTING
app.use("/css", express.static(__dirname + '/css'));
app.use("/vendor", express.static(__dirname + '/vendor'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/images", express.static(__dirname + '/images'));

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
    var client = clients[clients.length - 1];
    var position = clients.length - 1;
    ws.on('message', function(message) {
        console.log('received: %s', message);
        message = JSON.parse(message);
        // check if it is a new actor
        if (message.clientType){
            console.log('new actor, clienttype: %s', message.clientType);
            client.clientType = message.clientType;
        } else {
            updateScoreboard(message);

//            switch (message.action){
//
//                case 'updateScore':
//                    console.log('update Score --- team: ' + message.team + ', score: ' + message.score);
//                    break;
//                case 'updateTime':
//                    console.log('update Time --- team: ' + message.team + ', time: ' + message.time);
//                    break;
//
//                case 'timer':
//                    console.log('Timer action --- team: ' + message.team + ', type: ' + message.type);
//                    break;
//
//                case 'game':
//                    console.log('Active game --- : ' + message.label);
//                    break;
//
//                case 'suggestion':
//                    console.log('Active game --- : ' + message.label);
//                    break;
//
//                case 'gameDone':
//                    console.log('No active games');
//                    break;
//
//                case 'suggestionDone':
//                    console.log('No active suggestions');
//                    break;
//            }
        }

        ws.on('close', function(){
            console.log('closing a connection...');
            clients.splice(position, 1);
        });
    });
});

function updateScoreboard(message){
    var i;

    for (i=0; i < clients.length; i++){
        console.log(clients[i].clientType);
        if (clients[i].clientType === 'scoreboard'){
            clients[i].socket.send(JSON.stringify(message));
        }
    }
}
// TODO: save state serverside
// Maybe persist state to JSON files, to avoid losing all data when something goes wrong...
//var fs = require('fs');
//
//function saveState() {
//    fs.writeFile('/tmp/chat-state.json', JSON.stringify(CHAT));
//    setTimeout(saveState, 10000);
//}
//
//setTimeout(saveState, 10000);