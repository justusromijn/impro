var socket = new WebSocket("ws://localhost:8080");

socket.onopen = function(){
    // register as a juror
    var message = {
        clientType: 'scoreboard'
    };
    socket.send(JSON.stringify(message));
};

socket.onmessage = function(msg){
    message = JSON.parse(msg.data);

    switch (message.action){

        case 'updateScore':

            $('.team.' + message.team).find('.points').text(message.score);
            break;
        case 'updateTime':
            $('.team.' + message.team).find('.timer').text(message.time);
            break;
        case 'game':
            $('.game').find('.active').text(message.label);
            break;

    case 'suggestion':
        $('.suggestions').find('')
        console.log('Active game --- : ' + message.label);
        break;

    case 'gameDone':
        $('.game').find('.active').text('');
        break;
//
//    case 'suggestionDone':
//        console.log('No active suggestions');
//        break;
    }

};
