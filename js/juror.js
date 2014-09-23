// open websocket
var socket = new WebSocket("ws://localhost:8080"),
    games = [];

socket.onopen = function(){
    // register as a juror
    var message = {
        clientType: 'juror'
    };
    socket.send(JSON.stringify(message));
};

socket.onmessage = function(msg){
    var data = JSON.parse(msg.data);

    if (data.currentGame) {
        games = data.currentGame.games;
        suggestions = data.currentGame.suggestions;
        games.forEach(function (game) {
            GameDOM(game);
        });
        suggestions.forEach(function(suggestion){
            SuggestionDOM(suggestion);
        })
    }
};

$('document').ready(function(){

    // catch game submit
    $('#games-form').on('submit', function(event){
        var newGame = $('#games-new');
        event.preventDefault();

        addGame(newGame.val());
        socket.send(JSON.stringify({ newGame: newGame.val() }));

        newGame.val('');
        console.log('submitting a new game');
    });

    // catch suggestion submit
    $('#suggestions-form').on('submit', function(event){
        var newSuggestion = $('#suggestions-new');
        event.preventDefault();

        addSuggestion(newSuggestion.val());
        socket.send(JSON.stringify({ newSuggestion: newSuggestion.val() }));

        newSuggestion.val('');
        console.log('submitting a new game');
    });

    $('#new-round-button').click(function(event){
        event.preventDefault();
        $('#new-round').removeClass('hidden');
    });

});

function addGame(name){
    GameDOM(name);
}
function removeGame(name){
    socket.send(JSON.stringify({ removeGame: name }));
}
function GameDOM(name){
    var row = $('<tr><td>' + name + '</td><td><button type="button" class="btn btn-default"><span class="glyphicon glyphicon-remove-sign"></span> Verwijderen</button></td></tr>');
    $('#games-list').append(row);

    row.find('.btn').click(function(){
        removeGame(name);

        row.remove();
    });
}

function addSuggestion(name){
    SuggestionDOM(name);
}
function removeSuggestion(name){
    socket.send(JSON.stringify({ removeSuggestion: name }));
}
function SuggestionDOM(name){
    var row = $('<tr><td>' + name + '</td><td><button type="button" class="btn btn-default"><span class="glyphicon glyphicon-remove-sign"></span> Verwijderen</button></td></tr>');
    $('#suggestions-list').append(row);

    row.find('.btn').click(function(){
        removeSuggestion(name);

        row.remove();
    });
}