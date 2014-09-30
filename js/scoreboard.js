// open websocket
var host = location.origin.replace(/^http/, 'wss'),
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

        // SYNC game status here...

    } else if (data.updatePoints){
        console.log('oergre');
        var roundPoints = 0;
        $.each(data.updatePoints, function(index, point){
            roundPoints += point.point;
        });
        $('.round-screen .points').text(roundPoints);
    } else if (data.updateTime){
        $('.round-screen .time').text(data.updateTime);
        // UPDATE time
    }
};
