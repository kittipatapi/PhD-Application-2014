// JS for AW Email Widget

(function ($) {

$(document).ready(function() {
	$('.ufe-primary-email-field').hover(
		function(){
			var ufeEmailPos = $('.ufe-primary-email-field').offset(),
			ufeEmailLeft = ufeEmailPos.left + 4,
			ufeEmailHeight = $('.ufe-primary-email-field').innerHeight(),
			ufeToolTipTop = ufeEmailPos.top + $('.ufe-primary-email-field').height();
			$('#ufe-primary-email-tooltip').css({'display': 'block', 'left': ufeEmailLeft, 'top': ufeToolTipTop, 'margin-top': ufeEmailHeight})
		}, function(){
			$('#ufe-primary-email-tooltip').removeAttr('style')
	});
	// Demo Drop
	$('.ufe-info-banner .awui.close').click(function() {
		$(this).parent().fadeOut(200);
	});
});

})(window.jQuery);
