/*
 * Utility function to escape CSS characters in an ID selector for jQuery, e.g. '.' and ':'
 */
function awJqEscape (id) {
	return typeof id == 'undefined' ? undefined : id.replace(/(:|\.)/g,'\\$1');
}

/* 
 * these take the place of $.browser functions removed in jQuery 1.9.1.
 * the goal would be to stop use of them when we can
 */

var awIsMSIE = (function()
{
	var userAgent = navigator.userAgent.toLowerCase(),
		isIE = /msie/.test( userAgent ) && !/opera/.test( userAgent );
	
	return function() { return isIE; };
})();

var awIsMozilla = (function()
{
	var userAgent = navigator.userAgent.toLowerCase(),
		isMoz = /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent );
	
	return function() { return isMoz; };
})();

/*
 * Function to deal with IE8 (and others) not having window.console defined unless the
 * developer tools are open.
 */
var awDebug = location.host != "www.applyweb.com" || /(\?|&)?jquerydbg=\d+(&|$)?/.test(location.search);

function awConsole()
{
	if(!window.console || arguments.length == 0 || !awDebug)
		return;
	var args = Array.prototype.slice.call(arguments),
		level = args.length == 1 || console[args[0]] == undefined ? "log" : args.shift();
	
	if(awIsMSIE())
		console[level](args.join(" "));
	else
		console[level].apply(console, args);
}