(function(){
    var homeCountInterval = null,
        awayCountInterval = null;

    $('.timer').on('click', onTimerClick);
    $('.start').on('click', onTimerStart);
    $('.bonus').on('click', onBonusClick);
    $('.penalty').on('click', onPenaltyClick);

    function onTimerClick(){
        if($('.editing', this).hasClass('hidden')){
            var minutes = parseInt($('.minutes', this).text());
            var seconds = parseInt($('.seconds', this).text());

            $('.showing', this).addClass('hidden');
            $('.editing', this).removeClass('hidden');
            $('.minutes-input', this).val(minutes + '');
            $('.seconds-input', this).val(seconds + '');

            $('.save-timer', this).on('click', function(e){
                var timer = $(this).parents('.timer');
                var minutes = parseInt($(this).siblings('.minutes-input').val());
                var seconds = parseInt($(this).siblings('.seconds-input').val());

                if(!isNaN(minutes) && !isNaN(seconds)){
                    if ((seconds + '').length < 2){
                        seconds = '0' + seconds;
                    }
                    timer.removeClass('time-up');
                    timer.find('.editing').addClass('hidden');
                    timer.find('.showing').removeClass('hidden');
                    timer.find('.minutes').text(minutes);
                    timer.find('.seconds').text(seconds);
                }

                e.stopPropagation();
            });
        }
    }

    function onTimerStart(){
        var timer = $(this).siblings('.timer'),
            minutes,
            seconds,
            amount,
            team = !!($(this).parents('.team-home').length) ? 'home' : 'away';


        if (timer.hasClass('editing')){
            return;
        }

        if($(this).hasClass('stop')){
            if (team === 'home'){
                clearInterval(homeCountInterval);
            } else {
                clearInterval(awayCountInterval);
            }

            socket.send(JSON.stringify({
                action: 'timer',
                team: team,
                type: 'stop'
            }));


            $(this).text('START').removeClass('stop');
        } else {
            $(this).text('STOP').addClass('stop');

            minutes = $('.minutes', timer);
            seconds = $('.seconds', timer);
            if (team === 'home'){
                // TODO: server call: highlight home timer

                homeCountInterval = setInterval(function(){
                    countDown(homeCountInterval, team);
                }, 1000);
            } else {
                // TODO: server call: highlight away timer
                awayCountInterval = setInterval(function(){
                    countDown(awayCountInterval, team);
                }, 1000);
            }

            socket.send(JSON.stringify({
                action: 'timer',
                team: team,
                type: 'start'
            }));

            function countDown(interval, team){
                amount = parseInt(minutes.text()) * 60 + parseInt(seconds.text());
                amount -= 1;

                if (amount >= 0){

                    minutes.text(Math.floor(amount / 60));
                    seconds.text(amount % 60);
                    if (amount % 60 === 0){
                        console.log('add two points...');
                        addPoints(2, team);
                    }

                    if (seconds.text().length < 2){
                        if (seconds.text().length === 0){
                            seconds.text('00');
                        } else {
                            seconds.text('0' + seconds.text());
                        }
                    }

                    socket.send(JSON.stringify({
                        action: 'updateTime',
                        team: team,
                        time: minutes.text() + ':' + seconds.text()
                    }));

                    // give time to scoreboard
                    // using team parameter, seconds and minutes (all logic is here, scoreboard just updates display)

                } else {
                    clearInterval(interval);
                    timer.addClass('time-up');
                }
            }
        }
    }

    function onBonusClick(){
        // TODO: find out which bonus
        if ($('.start.stop').parent().hasClass('team-home')) {
            addPoints(1, 'home');
        }
        if ($('.start.stop').parent().hasClass('team-visitor')){
            addPoints(1, 'away');
        }
    }
    function onPenaltyClick(){
        // TODO: find out which penalty
        var team;
        if ($('.start.stop').parent().hasClass('team-home')){
            team = 'home';
        } else if ($('.start.stop').parent().hasClass('team-visitor')){
            team = 'away';
        }

        if (team){
            removePoints(1, team);
        }
    }

    function addPoints(points, team){
        var score = $('.scores .score-' + team);
        var scoreValue = parseInt(score.text());
        scoreValue += points;
        score.text(scoreValue);

        socket.send(JSON.stringify({
            action: 'updateScore',
            team: team,
            score: scoreValue
        }));
    }

    function removePoints(points, team){
        var score = $('.scores .score-' + team);
        var scoreValue = parseInt(score.text());
        scoreValue -= points;
        score.text(scoreValue);

        socket.send(JSON.stringify({
            action: 'updateScore',
            team: team,
            score: scoreValue
        }));
    }
})();