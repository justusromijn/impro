(function(){

    $('.games .add span').on('click', function(){
        var input = $(this).siblings('input');

        if (input.val()){
            addGame(input.val());
            input.val('');
            input.focus();
        }
    });
    $('.games').on('click', function(e){
        if ($(e.target).hasClass('delete')){
            $(e.target).parent().remove();
        }
    });

    function addGame(text){
        var list = $('.games .future .game-list');
        list.append('<div class="game"><span class="label">' + text + '</span><span class="delete">x</span></div>');
        list.children().last().draggable();

    }

    $('.games .future .game-list, .games .current .game-list, .games .past .game-list').droppable({
        accept: '.game',
        drop: function(event, ui){
            $(ui.draggable).detach().css({top: 0,left: 0}).appendTo(this);
            $(this).removeClass('hover');
            // update scoreboard with current games
            if ($(this).parent().hasClass('current')){
                socket.send(JSON.stringify({
                    action: 'game',
                    label: $('.label', ui.draggable).text()
                }));
            }
            else {
                socket.send(JSON.stringify({
                    action: 'gameDone'
                }));
            }
        },
        over: function(event, ui){
            $(this).addClass('hover');
        },
        out: function(event, ui){
            $(this).removeClass('hover');
        }
    });
})();