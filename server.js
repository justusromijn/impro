var express = require('express'),
    WebSocketServer = require('ws').Server,
    app = express(),
    wss = new WebSocketServer({port: 8080}),
    clients = [],
    scoreboard = null,
    juror = null,
    currentGame = {
        games: [],
        suggestions: [],
        homeTeam: {
            points: 0,
            time: 0
        },
        awayTeam: {
            points: 0,
            time: 0
        }
    },
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
app.use("/fonts", express.static(__dirname + '/fonts'));

app.get('/', function(req, res){
    res.sendfile('views/index.html');
});
app.get('/scoreboard', function(req, res){
    res.sendfile('views/scoreboard.html');
});
app.get('/juror', function(req, res){
    res.sendfile('views/juror.html');
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
            if (client.clientType === 'juror' && !juror){
                juror = client;
                // throw all game data to the client
                client.socket.send(JSON.stringify({ currentGame: currentGame}));
            } else if (client.clientType === 'scoreboard' && !scoreboard){
                scoreboard = client;
            }

        } else if (juror === client) {
            if (message.newGame){
                currentGame.games.push(message.newGame);
            } else if (message.removeGame){
                removeA(currentGame.games, message.removeGame);
            } else if (message.newSuggestion){
                currentGame.suggestions.push(message.newSuggestion);
            } else if (message.removeSuggestion){
                removeA(currentGame.suggestions, message.removeSuggestion);
            }
        }

        ws.on('close', function(){
            clients.splice(position, 1);
            if (juror === client){
                console.log('jury logged out...');
                juror = null;
            } else {
                console.log('scoreboard logged out...');
                scoreboard = null;
            }
        });
    });
});

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

function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}