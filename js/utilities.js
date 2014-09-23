$('document').ready(function(){

    // button links
    $('button[data-href]').on('click', function(){
        window.location = $(this).attr('data-href');
    });

    // button toggles
    $('button[data-show]').on('click', function() {
        var selector = $(this).attr('data-show');
        $('#working-space').children().addClass('hidden');
        $('#' + selector, '#working-space').removeClass('hidden');
    });

    $('button[data-toggler]').on('click', function(){
        var className = $(this).attr('data-toggler');
        var oldText = $(this).text();
        var newText = $(this).attr('data-text');
        $(this).toggleClass(className);
        $(this).text(newText);
        $(this).attr('data-text', oldText);

    });
});