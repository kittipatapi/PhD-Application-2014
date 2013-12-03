aw$(window).load(function()
{
	anchor = document.location.hash.substring(1); 
	if (anchor) {
		$anchor = aw$('a[name="'+anchor+'"]');
		if ($anchor.length > 0) {
	        	aw$('html,body').scrollTop($anchor.offset().top); // Move to the anchor from the current location
		}
	}
});
