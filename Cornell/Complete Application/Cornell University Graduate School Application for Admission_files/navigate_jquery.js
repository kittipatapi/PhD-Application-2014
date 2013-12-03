
// awNavigate

awNavigate = function () {
	var obj = this;

	obj.lastClicked = '';
	obj.toPage      = '';
	obj.disabled = false; // used to "lock down" image nav

	aw$(document).ready(function () {
		obj.init();
	});
}

awNavigate.prototype = {
	attachClickHandlers : function () {
		var obj = this;

		obj.AWForm.find(':submit[name=PGSAVE]').click(function () {
			obj.toPage = '';
			obj.lastClicked = 'PGSAVE';
		});
		obj.AWForm.find(':submit[name=EXIT]').click(function () {
			obj.toPage = '';
			obj.lastClicked = 'EXIT';
		});
		obj.AWForm.find(':submit[name=RESET]').click(function () {
			obj.toPage = '';
			obj.lastClicked = 'RESET';
		});
		obj.AWForm.find(':submit[name^=SEARCH]').click(function () {
			obj.toPage = '';
			obj.lastClicked = 'SEARCH';
		});
		obj.AWForm.find(':submit[name=APPSEND]').click(function () {
			obj.toPage = '';
			obj.lastClicked = 'APPSEND';
		});
		obj.AWForm.find(':submit[name=p]').click(function (eventObj) {
 			// only set toPage if we're headed to a numerical page using page nav
			obj.toPage = eventObj.target.value;
			obj.lastClicked = 'PAGE';
		});
		obj.AWForm.find(':submit[name=PREVPAGE]').click(function (eventObj) {
			// can't set toPage because only the engine knows (could be conditional pages)
			obj.toPage = '';
			obj.lastClicked = 'PREVPAGE';
		});
		obj.AWForm.find(':submit[name=NEXTPAGE]').click(function (eventObj) {
			// can't set toPage because only the engine knows (could be conditional pages)
			obj.toPage = '';
			obj.lastClicked = 'NEXTPAGE';
		});
		obj.AWForm.find(':submit[name=FIRSTPAGE]').click(function (eventObj) {
			obj.toPage = '';
			obj.lastClicked = 'FIRSTPAGE';
		});
		obj.AWForm.find(':submit[name=LASTPAGE]').click(function (eventObj) {
			obj.toPage = '';
			obj.lastClicked = 'LASTPAGE';
		});
		obj.AWForm.find(':submit[name=ERRPGBACK]').click(function () {
			obj.toPage = '';
			obj.lastClicked = 'ERRPGBACK';
		});
		obj.AWForm.find(':submit[name=ERRPGPOST]').click(function () {
			obj.toPage = '';
			obj.lastClicked = 'ERRPGPOST';
		});
	},

	// when calling this from onClick, do: return doPageSave();
	doPageSave : function () {
		var obj = this;
		obj.forceValueAndSubmit('PGSAVE',1);
		return false;
	},

	// when calling this from onClick, do: return doExit();
	doExit : function () {
		var obj = this;
		obj.forceValueAndSubmit('EXIT',1);
		return false;
	},

	// when calling this from onClick, do: return doSend();
	doSend : function () {
		var obj = this;
		obj.forceValueAndSubmit('APPSEND',1);
		return false;
	},

	// when calling this from onClick, do: return doReset();
	doReset : function () {
		var obj = this;
		obj.forceValueAndSubmit('RESET',1);
		return false;
	},

	// when calling this from onClick, do: return doPrevPage();
	doPrevPage : function () {
		var obj = this;
		obj.forceValueAndSubmit('PREVPAGE',1);
		return false;
	},

	// when calling this from onClick, do: return doNextPage();
	doNextPage : function () {
		var obj = this;
		obj.forceValueAndSubmit('NEXTPAGE',1);
		return false;
	},

	// when calling this from onClick, do: return doFirstPage();
	doFirstPage : function () {
		var obj = this;
		obj.forceValueAndSubmit('FIRSTPAGE',1);
		return false;
	},

	// when calling this from onClick, do: return doLastPage();
	doLastPage : function () {
		var obj = this;
		obj.forceValueAndSubmit('LASTPAGE',1);
		return false;
	},

	forceValueAndSubmit : function (name, value) {
		var obj = this;
		if (obj.disabled) return false;

		var elem = obj.AWForm.find('input[name=' + name + ']').filter(':hidden');
		if (elem.size() < 1) {
			aw$('<input name="' + name + '" type="hidden" />').val(value).appendTo(obj.AWForm);
		}
		else {
			elem.val(value);
		}
		obj.AWForm.submit();
	},

	goToPage : function (page) {
		var obj = this;
		obj.forceValueAndSubmit('p',page);
	},

	init : function () {
		var obj = this;
		obj.AWForm = aw$('form#ufe-main-form');

		if (obj.AWForm.size() != 1) {
			// note: this causes issues for non-form system pages
			// alert("Configuration error, couldn't find main form");
			return;
		}

		obj.attachClickHandlers();
	},

	isCrxAction : function () {
		var obj = this;
		return obj.lastClicked.match(/^ERRPG/) ? true : false;
	},

	isCrxGoBack : function () {
		var obj = this;
		return obj.lastClicked == 'ERRPGBACK' ? true : false;
	},

	isCrxSubmit : function () {
		var obj = this;
		return obj.lastClicked == 'ERRPGPOST' ? true : false;
	},

	isPageSave : function () {
		var obj = this;
		return obj.lastClicked == 'PGSAVE' ? true : false;
	},

	isPageTurn : function () {
		var obj = this;
		return obj.lastClicked.match(/PAGE$/) ? true : false;
	},

	isExit : function () {
		var obj = this;
		return obj.lastClicked == 'EXIT' ? true : false;
	},

	isReset : function () {
		var obj = this;
		return obj.lastClicked == 'RESET' ? true : false;
	},

	isSearch : function () {
		var obj = this;
		return obj.lastClicked == 'SEARCH' ? true : false;
	},

	isSend : function () {
		var obj = this;
		return obj.lastClicked == 'APPSEND' ? true : false;
	},

	// when calling this, do as such: return linkToPage(page);
	linkToPage : function (page) {
		var obj = this;
		obj.goToPage(page);
		return false; // for the click behavior
	},

	mouseOver : function () {
		window.status=' ';
		return false;
	}
}
