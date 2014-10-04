// open websocket
var host = location.origin.replace(/^http/, 'ws'),
    socket = new WebSocket(host);

socket.onopen = function(){
    var message = {
        clientType: 'scoreboard'
    };
    if (socket.readyState === 1) {
        socket.send(JSON.stringify(message));
    }
};

socket.onmessage = function(msg){
    var data = JSON.parse(msg.data);
    if (data.gameInit){
        $('#home-label').text(data.gameInit.home.label);
        $('#away-label').text(data.gameInit.away.label);
        $('#home-timeleft').text(data.gameInit.home.time);
        $('#away-timeleft').text(data.gameInit.away.time);
        $('#home-percentage').text(data.gameInit.home.percentage);
        $('#away-percentage').text(data.gameInit.away.percentage);
        $('#progress-home').css({ width : data.gameInit.home.percentage + '%' });
        $('#progress-away').css({ width : data.gameInit.away.percentage + '%' });
        // SYNC game status here...

    } else if (data.showRound) {
        var roundPoints = 0;
        $.each(data.showRound.points, function(index, point){
            roundPoints += point.point;
            addJuryPoint(point.theme);

        });
        $('.home-screen').addClass('hidden');
        $('.round-screen').removeClass('hidden');

        $('.round-screen .team-name').text(data.teamName);
        $('.round-screen .game-title').text(data.showRound.game);
        $('.round-screen .suggestions-titles').text(data.showRound.suggestions.join(', '));
        $('.round-screen .points').text(roundPoints);
        $('.round-screen .time').text(data.timeLeft);
    } else if (data.hideRound){
        $('.home-screen').removeClass('hidden');
        $('.round-screen').addClass('hidden');
        clearJuryPoints();

        // SYNC game status here...

    } else if (data.updatePoints){
        var roundPoints = 0;
        $.each(data.updatePoints, function(index, point){
            roundPoints += point.point;
        });
        var addedPoint = data.updatePoints[data.updatePoints.length - 1];
        addJuryPoint(addedPoint.theme);
        highlightJuryPoints(addedPoint);
        $('.round-screen .points').text(roundPoints);
    } else if (data.updateTime){
        $('.round-screen .time').text(data.updateTime);
        // UPDATE time
    }
};

function addJuryPoint(theme){
    var themeEl = $('.' + theme);
    if (themeEl.find('span').length){
        var currentMultiplier = parseInt(themeEl.find('span').text() ,10);
        themeEl.find('span').text(currentMultiplier + 1);
    } else {
        themeEl.addClass('active');
        themeEl.html('<span class="multiplier">1</span>');
    }
}
function clearJuryPoints(){
    var elements = $('.bonus > div, .penalty > div');
    elements.each(function(index, el){
        $(el).empty();
        $(el).removeClass('active');
    })
}
function highlightJuryPoints(point){
    var text = '';
    var juryAction = $('.jury-action');

    switch (point.theme){
        case 'funny':
            text = 'grappige scene';
            break;
        case 'finish':
            text = 'sterk einde';
            break;
        case 'emotions':
            text = 'veel emotie';
            break;
        case 'teamwork':
            text = 'goede samenwerking';
            break;
        case 'spectacle':
            text = 'spectaculair';
            break;

        case 'rude':
            text = 'grof taalgebruik';
            break;
        case 'boring':
            text = 'saai';
            break;
        case 'explanation':
            text = 'uitleg nodig';
            break;
        case 'confusing':
            text = 'verwarrende scene';
            break;
        case 'garbage':
            text = 'ongebruikt item';
            break;
    }
    juryAction.addClass(point.theme);
    juryAction.addClass('active');
    juryAction.text(text);

    setTimeout(function(){
        juryAction.removeClass('active');
    }, 3000);
    setTimeout(function(){
        juryAction.text('');
        juryAction.removeClass(point.theme);
    }, 4000);

}