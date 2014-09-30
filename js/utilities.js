$('document').ready(function(){

    // button links
    $('button[data-href]').on('click', function(event){
        event.preventDefault();
        window.location = $(this).attr('data-href');
    });

    // toggle pages
    $('button[data-page]').on('click', function(event) {
        event.preventDefault();
        var selector = $(this).attr('data-page');
        $('#working-space').children().addClass('hidden');
        $('#' + selector, '#working-space').removeClass('hidden');
    });

    // show single tab
    $('button[data-show], a[data-show]').on('click', function(event) {
        event.preventDefault();
        var selector = $(this).attr('data-show');
        $('#' + selector).removeClass('hidden');
    });

    // hide single tab
    $('button[data-hide], a[data-hide]').on('click', function(event) {
        event.preventDefault();
        var selector = $(this).attr('data-hide');
        $('#' + selector).addClass('hidden');
    });

    $('button[data-toggler]').on('click', function(event){
        event.preventDefault();
        var className = $(this).attr('data-toggler');
        var oldText = $(this).text();
        var newText = $(this).attr('data-text');
        $(this).toggleClass(className);
        $(this).text(newText);
        $(this).attr('data-text', oldText);
    });
});

var rand = function() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

var token = function() {
    return rand() + rand(); // to make it longer
};