(function(){
    $('.suggestions .add span').on('click', function(){
        var input = $(this).siblings('input');

        if (input.val()){
            addSuggestion(input.val());
            input.val('');
            input.focus();
        }
    });
    $('.suggestions').on('click', function(e){
        if ($(e.target).hasClass('delete')){
            $(e.target).parent().remove();
        }
    });

    function addSuggestion(text){
        var list = $('.suggestions .future .suggestions-list');
        list.append('<div class="suggestion"><span class="label">' + text + '</span><span class="delete">x</span></div>');
        list.children().last().draggable();

    }

    $('.suggestions .future .suggestions-list, .suggestions .current .suggestions-list, .suggestions .past .suggestions-list').droppable({
        accept: '.suggestion',
        drop: function(event, ui){
            $(ui.draggable).detach().css({top: 0,left: 0}).appendTo(this);
            $(this).removeClass('hover');
            // update scoreboard with current games
            if ($(this).parent().hasClass('current')) {
                socket.send(JSON.stringify({
                    action: 'suggestion',
                    label: $('.label', ui.draggable).text()
                }));
            } else {
                socket.send(JSON.stringify({
                    action: 'suggestionDone'
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