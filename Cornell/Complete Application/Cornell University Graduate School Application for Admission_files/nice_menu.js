aw$(function() {
  aw$('ul.nice-menu li.menuparent').hover(
    function() {
      aw$(this).find('.child-container').css('visibility', 'visible');
      aw$(this).children('a').addClass('hover');
      aw$(this).addClass('over');
    },
    function() {
      aw$(this).find('.child-container').css('visibility', 'hidden');
      aw$(this).children('a').removeClass('hover');
      aw$(this).removeClass('over');
    });
});

