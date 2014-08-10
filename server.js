var express = require('express'),
    WebSocketServer = require('ws').Server,
    app = express();
    wss = new WebSocketServer({port: 8080});

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
    ws.on('message', function(message) {
        console.log('received: %s', message);
    });
    ws.send('something');
});