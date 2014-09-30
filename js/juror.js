// open websocket
var host = location.origin.replace(/^http/, 'ws'),
    socket = new WebSocket(host),
    games = [],
    timerInterval = null;

socket.onopen = function(){
    // register as a juror
    var message = {
        clientType: 'juror'
    };
    if (socket.readyState === 1) {
        socket.send(JSON.stringify(message));
    }
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

    $.ajax('/services/rounds').done(function(response){
        $.each(response.rounds, function(i,round){
            addRound(round);
        });
    });

    $.ajax('/services/time').done(function(response){
        $('#first-half-home').children('.minutes').text(response.firstHalf.home.minutes);
        $('#first-half-home').children('.seconds').text(response.firstHalf.home.seconds);
        $('#second-half-home').children('.minutes').text(response.secondHalf.home.minutes);
        $('#second-half-home').children('.seconds').text(response.secondHalf.home.seconds);
        $('#first-half-away').children('.minutes').text(response.firstHalf.away.minutes);
        $('#first-half-away').children('.seconds').text(response.firstHalf.away.seconds);
        $('#second-half-away').children('.minutes').text(response.secondHalf.away.minutes);
        $('#second-half-away').children('.seconds').text(response.secondHalf.away.seconds);
    });

    $.ajax('/services/settings').done(function(response){
        $('#team-home').val(response.settings.home);
        $('#team-away').val(response.settings.away);
        $('#first-half').val(response.settings.firstHalf);
        $('#second-half').val(response.settings.secondHalf);
    });

    // save settings
    $('#save-settings').on('click', function(event){
        var firstHalf = parseInt($('#first-half').val()) * 60,
            secondHalf = parseInt($('#second-half').val()) * 60,
            teamHome = $('#team-home').val(),
            teamAway = $('#team-away').val();

        socket.send(JSON.stringify({
            settings: {
                firstHalf: firstHalf,
                secondHalf: secondHalf,
                teamHome: teamHome,
                teamAway: teamAway
            }
        }));
        event.preventDefault();
    });
    $('#reset-game').on('click', function(event){
        $.ajax('/services/reset').done(function(response){
            alert('Alles is leeggemaakt.');
        });
    });

    $('#halfs-tabs a').on('click', function(event){
        event.preventDefault();
        $(this).tab('show');
    });

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

    $('#new-round-button').on('click', function(event){
        $.ajax('/services/games').done(function(response){

            var target = $('#games-select'),
                games = response.games,
                i;

            target.empty();
            for (i=games.length;i>0;i--){
                target.append('<option>' + games[games.length - i] + '</option>');
            }
        });

        $.ajax('/services/suggestions').done(function(response){

            var target = $('#suggestions-checkboxes'),
                suggestions = response.suggestions,
                i;
            target.empty();
            for (i=suggestions.length;i>0;i--){
                target.append('<div class="checkbox"><label><input type="checkbox" value="' + suggestions[suggestions.length - i] + '"> ' + suggestions[suggestions.length - i] + ' </label></div>');
            }
        });
    });

    $('#add-new-round').on('click', function(){
        var round = {
            id: token(),
            half: $('.active', '#halfs-tabs').attr('data-half'),
            points: [],
            team: $('option:selected', '#team-select').val(),
            game: $('option:selected', '#games-select').text(),
            suggestions: $.map($('input:checkbox:checked', '#suggestions-checkboxes'), function (item) {
                return item.value
            })
        };
        socket.send(JSON.stringify({ newRound: round }));

        addRound(round);
    });

});

function addRound(round){
    var suggestions = round.suggestions.join(', '),
        team = round.team === 'home' ? 'Thuis' : 'Uit',
        half = round.half,
        points = 0,
        id = round.id;

        round.points.forEach(function(point){
            points += point.point;
        });


    if (suggestions.length){
        suggestions += '.';
    }


    $('#game-rounds').children('#' + half + '-half-rounds').append('<div id="' + round.id + '" class="' + team + ' panel panel-default">' +
        '<div class="panel-heading clearfix"><button class="timer-start btn btn-success">Start timer</button>' +
        '<div class="pull-right">Scorebord: <button id="show-scoreboard" class="btn btn-sm btn-default">Toon spel</button></div></div>' +
        '<div class="panel-body">' +
        '<div class="container-fluid"><div class="row"><div class="col-md-6">' +
        '<h4><small>Team:</small> ' + team + '</h4>' +
        '<h4><small>Spel:</small> ' + round.game + '</h4><h5><small>Suggesties:</small> ' + suggestions + '</h5>' +
        '<h3><small>Punten: </small><span class="points">' + points + '</span></h3></div>' +
        '<div class="col-md-3">' +
        '<button class="modifier btn btn-xs btn-block btn-success" data-modify="bonus" data-theme="funny">Grappig</button>' +
        '<button class="modifier btn btn-xs btn-block btn-success" data-modify="bonus" data-theme="finish">Goede finish</button>' +
        '<button class="modifier btn btn-xs btn-block btn-success" data-modify="bonus" data-theme="emotions">Veel emoties</button>' +
        '<button class="modifier btn btn-xs btn-block btn-success" data-modify="bonus" data-theme="teamwork">Goede samenwerking</button>' +
        '<button class="modifier btn btn-xs btn-block btn-success" data-modify="bonus" data-theme="spectacle">Spectaculair</button>' +
        '</div><div class="col-md-3">' +
        '<button class="modifier btn btn-xs btn-block btn-danger" data-modify="penalty" data-theme="rude">Grof taalgebruik</button>' +
        '<button class="modifier btn btn-xs btn-block btn-danger" data-modify="penalty" data-theme="boring">Saai...</button>' +
        '<button class="modifier btn btn-xs btn-block btn-danger" data-modify="penalty" data-theme="explanation">Uitleg nodig</button>' +
        '<button class="modifier btn btn-xs btn-block btn-danger" data-modify="penalty" data-theme="confusing">Verwarrend</button>' +
        '<button class="modifier btn btn-xs btn-block btn-danger" data-modify="penalty" data-theme="garbage">Ongebruikt item / onderwerp</button>' +
        '</div></div></div></div>' +
        '<div class="panel-footer">' +
        '<button class="btn btn-info">Archiveren</button> <button class="btn pull-right btn-link btn-link-danger" id="delete-round">Verwijder ronde</button></div>' +
        '</div>');

    var pointsElement = $('#' + round.id + ' .points');

    $('#' + round.id).on('click', '#delete-round', function(event){
        event.preventDefault();
        socket.send(JSON.stringify({ removeRound: id }));
        $(this).parent().parent().remove();
    });

    $('#' + round.id + ' #show-scoreboard').on('click', function(event){
        event.preventDefault();

        $(this).toggleClass('btn-info');

        if ($(this).hasClass('btn-info')){
            $(this).text('Verberg spel');

            socket.send(JSON.stringify({
                showRound: {
                    round: round.id
                }
            }));

        } else {
            $(this).text('Toon spel');

            socket.send(JSON.stringify({
                hideRound: true
            }));
        }
    });

    $('#' + round.id).on('click', '.modifier', function(event){
        event.preventDefault();
        var point = $(this).attr('data-modify') === "bonus" ? 1 : -1;

        socket.send(JSON.stringify({ juryPoint: {
            round: round.id,
            point: point,
            theme: $(this).attr('data-theme')
        } }));

        var currentPoints = parseInt(pointsElement.text());
        if (!currentPoints){
            currentPoints = 0;
        }
        pointsElement.text(currentPoints + point);
    });

    $('#' + round.id).on('click', '.timer-start', function(event){
        event.preventDefault();
        $(this).toggleClass('btn-danger');

        if ($(this).hasClass('btn-danger')){
            $(this).text('Stop timer');
            // TODO: start timer, calculation?
            startTimer(team, half, function(){
                $(this).toggleClass('btn-danger');
                $(this).text('Start timer');
            });
        } else {
            $(this).text('Start timer');
            stopTimer(team, half);
        }
    });

    // TODO : bonus / penalties add to round points

}

function addGame(name){
    GameDOM(name);
}
function removeGame(name){
    socket.send(JSON.stringify({ removeGame: name }));
}
function GameDOM(name){
    var row = $('<tr><td><h5>' + name + '</h5></td><td><button type="button" class="btn btn-danger"><span class="glyphicon glyphicon-remove-sign"></span> Verwijderen</button></td></tr>');
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
    var row = $('<tr><td><h5>' + name + '</h5></td><td><button type="button" class="btn btn-danger"><span class="glyphicon glyphicon-remove-sign"></span> Verwijderen</button></td></tr>');
    $('#suggestions-list').append(row);

    row.find('.btn').click(function(){
        removeSuggestion(name);

        row.remove();
    });
}

function startTimer(teamParam, half, callback){
    var team = teamParam === "Thuis" ? 'home' : 'away';
    var minutes = $('#' + half + '-half-' + team + ' .minutes'),
        seconds = $('#' + half + '-half-' + team + ' .seconds');

    timerInterval = setInterval(function(){
        if (parseInt(seconds.text()) < 1){
            seconds.text("59");
            if (parseInt(minutes.text()) < 1){
                alert('TIJD OP!');

                stopTimer();
                callback();

            } else {
                minutes.text(parseInt(minutes.text()) - 1);
            }
        } else {
            seconds.text(parseInt(seconds.text()) - 1);
        }
        socket.send(JSON.stringify({
            timer: {
                team: team,
                half: half
            }
        }));

    }, 1000);
}

function stopTimer(){
    clearInterval(timerInterval);
}