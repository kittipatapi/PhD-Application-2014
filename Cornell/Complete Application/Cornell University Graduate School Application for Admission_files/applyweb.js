/**
 * Applyweb Framing Check
 *
 * Checks to see if an applyweb form is framed by a third party.
 *
 * Copyright 2006 CollegeNET, Inc. All rights reserved.
 *
 * @author  Michael Ratliff
 * @version 1.0
 */
 
 /**
  * 12-28-2006 - Added try catch due to uncaught execption errors in some browsers. JM
  */
try {
	if (top.location.href.indexOf("anycollege.net") != -1 ) { document.location.href="http://forbidden.applyweb.com/rewrite.html"; }
	
} catch (ex) { ; }

