console.log('NODE STARTING, YAY!!!');
var express = require('express'),

    rand = function() { return Math.random().toString(36).substr(2) },
    token = function() { return rand() + rand()}, // to make it longer
    WebSocketServer = require('ws').Server,
    bodyParser = require('body-parser'),
    fs = require('fs'),
    app = express(),
    wss = new WebSocketServer({server: app, port: 8080}),
    clients = [],
    scoreboard = [],
    juror = null,
    currentGame = {
        games: [],
        // TODO: filter games already allocated in a round
        // gamesPool: ["spel 1", "spel 2", "spel 3"],
        suggestions: [],
        // TODO: filter suggestions already allocated in a round
        // suggestionsPool: ["suggestie 1", "suggestie 2", "suggestie 3"],
        rounds: [],
        // total time available
        firstHalf: 0,
        secondHalf: 0,
        home: {
            points: 0,
            // time played
            firstHalf: 0,
            secondHalf: 0
        },
        away: {
            points: 0,
            // time played
            firstHalf: 0,
            secondHalf: 0
        }
    },
    lusca = require('lusca');

    // restore state after reboot
    var buf = fs.readFileSync('./state.json', "utf8");

    if (buf.length ){
        currentGame = JSON.parse(buf);
    }

// MIDDLEWARE

// SECURITY
app.use(lusca({
    //csrf: true,
    csp: { reportOnly: true },
    xframe: 'SAMEORIGIN',
    hsts: {maxAge: 31536000, includeSubDomains: true},
    xssProtection: true
}));

app.use(bodyParser.json());

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

// SERVICES
app.get('/services/games/', function(req, res){
    res.json({ games: currentGame.games });
});
app.get('/services/suggestions', function(req, res){
    res.json({ suggestions: currentGame.suggestions });
});
app.get('/services/rounds', function(req, res){
    res.json({ rounds: currentGame.rounds });
});
app.get('/services/settings', function(req, res){
    res.json({ settings: {
            firstHalf: currentGame.firstHalf / 60,
            secondHalf: currentGame.secondHalf / 60,
            home: currentGame.home.label,
            away: currentGame.away.label
        }
    });
});

app.get('/services/reset', function(req, res){
    currentGame = {
        games: [],
        // TODO: filter games already allocated in a round
        // gamesPool: ["spel 1", "spel 2", "spel 3"],
        suggestions: [],
        // TODO: filter suggestions already allocated in a round
        // suggestionsPool: ["suggestie 1", "suggestie 2", "suggestie 3"],
        rounds: [],
        // total time available
        firstHalf: 0,
        secondHalf: 0,
        home: {
            points: 0,
            // time played
            firstHalf: 0,
            secondHalf: 0
        },
        away: {
            points: 0,
            // time played
            firstHalf: 0,
            secondHalf: 0
        }
    };
    res.status(200).end();
});

app.get('/services/time', function(req, res){
    var homeFirstHalfSeconds = (currentGame.firstHalf - currentGame.home.firstHalf) % 60,
        homeFirstHalfMinutes = Math.floor((currentGame.firstHalf - currentGame.home.firstHalf) / 60),
        homeSecondHalfSeconds = (currentGame.secondHalf - currentGame.home.secondHalf) % 60,
        homeSecondHalfMinutes = Math.floor((currentGame.secondHalf - currentGame.home.secondHalf) / 60),
        awayFirstHalfSeconds = (currentGame.firstHalf- currentGame.away.firstHalf) % 60,
        awayFirstHalfMinutes = Math.floor((currentGame.firstHalf - currentGame.away.firstHalf) / 60),
        awaySecondHalfSeconds = (currentGame.secondHalf - currentGame.away.secondHalf) % 60,
        awaySecondHalfMinutes = Math.floor((currentGame.secondHalf - currentGame.away.secondHalf) / 60);



    res.json({
        firstHalf: {
            home: {
                seconds: homeFirstHalfSeconds,
                minutes: homeFirstHalfMinutes
            },
            away: {
                seconds: awayFirstHalfSeconds,
                minutes: awayFirstHalfMinutes
            }
        },
        secondHalf: {
            home: {
                minutes: homeSecondHalfMinutes,
                seconds: homeSecondHalfSeconds
            },
            away: {
                minutes: awaySecondHalfMinutes,
                seconds: awaySecondHalfSeconds
            }
        }
    });
});

app.listen(process.env.PORT || 5000);


// SOCKETS
wss.on('connection', function(ws) {
    console.log('HOUSTON: we have got contact');
    var clientID = token();
    var client = {clientID: clientID, socket: ws, clientType: null};
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
            } else if (client.clientType === 'scoreboard'){
                scoreboard.push(client);

                updateHome();
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
            } else if (message.removeRound){
                for (var i=currentGame.rounds.length -1; i >= 0;i--){
                    if (currentGame.rounds[i].id === message.removeRound){
                        currentGame.rounds.splice(currentGame.rounds[i], 1);
                        return;
                    }
                }
            } else if (message.newRound){
                currentGame.rounds.push({
                    id: message.newRound.id,
                    game: message.newRound.game,
                    suggestions: message.newRound.suggestions,
                    team: message.newRound.team,
                    points: message.newRound.points,
                    half: message.newRound.half
                });
            } else if (message.settings){
                currentGame.firstHalf = message.settings.firstHalf;
                currentGame.secondHalf = message.settings.secondHalf;
                currentGame.home.label = message.settings.teamHome;
                currentGame.away.label = message.settings.teamAway;

                // TODO: update scorescreen
            } else if (message.timer){
                currentGame[message.timer.team][message.timer.half + 'Half']++;

                var time = getTime(message.timer.team, message.timer.half);
                scoreboard.forEach(function(board){
                    board.socket.send(JSON.stringify({
                        updateTime: time
                    }));
                });


            } else if (message.juryPoint){
                currentGame.rounds.forEach(function(round){
                    if (round.id === message.juryPoint.round){
                        round.points.push({
                            point: message.juryPoint.point,
                            theme: message.juryPoint.theme
                        });

                        scoreboard.forEach(function(board){
                            board.socket.send(JSON.stringify({
                                updatePoints: round.points
                            }));
                        });
                    }
                });

            } else if (message.showRound){
                var currentRound;
                currentGame.rounds.forEach(function(round){
                    if (round.id === message.showRound.round){
                        currentRound = round;
                    }
                });

                scoreboard.forEach(function(board){
                    board.socket.send(JSON.stringify({
                        showRound: currentRound,
                        teamName: currentGame[currentRound.team].label,
                        timeLeft: getTime(currentRound.team, currentRound.half)
                    }));
                });
            } else if (message.hideRound){
                scoreboard.forEach(function(board){
                    board.socket.send(JSON.stringify({
                        hideRound: true
                    }));
                });

                updateHome();
            }
        }

        ws.on('close', function(){
            if (juror === client){
                console.log('jury logged out...');
                juror = null;
            } else {
                console.log('scoreboard logged out...');
                scoreboard.forEach(function(scoreboardClient, index, array){
                    if (scoreboardClient.clientID === clientID){
                        array.splice(index,1);
                    }
                });
            }

        });
    });
});

function saveState() {
    fs.writeFile('./state.json', JSON.stringify(currentGame), function(err){
        if(err){
            console.log(err);
        } else {
            console.log('file saved');
        }
    });
    setTimeout(saveState, 10000);
}

setTimeout(saveState, 1000);

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

function getPoints(roundId){
    var result = 0;
    currentGame.rounds.forEach(function(round){
        if (round.id === roundId){
            round.points.forEach(function(point){
                result += point.point;
            });
        }

    });
    return result;
}
function getTeamPoints(team){
    var result = 0;
    currentGame.rounds.forEach(function(round){
        if (round.team === team){
            round.points.forEach(function(point){
                result += point.point;
            });
        }
    });

    return result;
}

function getTime(team, half){
    var minutes, seconds;
    if (half){
        minutes = Math.floor((currentGame[half + 'Half'] - currentGame[team][half + 'Half']) / 60);
        seconds = (currentGame[half + 'Half'] - currentGame[team][half + 'Half']) % 60;
    } else {
        minutes = Math.floor(((currentGame.firstHalf + currentGame.secondHalf) - (currentGame[team].firstHalf + currentGame[team].secondHalf)) / 60);
        seconds = ((currentGame.firstHalf + currentGame.secondHalf) - (currentGame[team].firstHalf + currentGame[team].secondHalf)) % 60;
    }
    return minutes + ':' + seconds;
}

function updateHome(){
    scoreboard.forEach(function(board){
        var max = Math.floor(((currentGame.firstHalf + currentGame.secondHalf)) / 60) * 2;
        var homePlayed = Math.floor(((currentGame.home.firstHalf + currentGame.home.secondHalf)) / 60) * 2;
        var awayPlayed = Math.floor(((currentGame.home.firstHalf + currentGame.home.secondHalf)) / 60) * 2;

        board.socket.send(JSON.stringify(
            { gameInit: {
                home: {
                    label: currentGame.home.label,
                    points: getTeamPoints('home'),
                    time: getTime('home'),
                    percentage: Math.round(((getTeamPoints('home') + homePlayed) / max) * 100)
                },
                away: {
                    label: currentGame.away.label,
                    points: getTeamPoints('away'),
                    time: getTime('away'),
                    percentage: Math.round(((getTeamPoints('away') + awayPlayed) / max) * 100)
                }
            }
        }));
    });
}