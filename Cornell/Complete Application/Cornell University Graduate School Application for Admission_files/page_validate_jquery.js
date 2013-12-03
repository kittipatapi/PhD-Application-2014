
// awPageValidate

// depends on AW_Navigate

var awPageValidate = (function($)
{
	var awValidate = function (params) {
		var obj = this;

		obj.locks = {};
		obj.lockSave = {};

		obj.messageMap = {
			fileupload: 'One or more file uploads are still in progress!'
		};

		obj.textMap = {
			submitText: 'Submitting...'	
		};

		obj.validationRuleMap = {};
		obj.validationFuncMap = {};

		// each entry has a 'name' for a key, then has members:
		//    method: 'GET', 'POST', 'DELETE'
		//    url: string value or function that returns string value
		//    params: map/object of params or function that returns map/object of params
		//    func: function to be called upon successful ajax response to parse/validate based on that response
		obj.asyncValidationMap = {};
		// this is the overall status, as opposed to the status of the individual calls
		obj.asyncValidationStatus = 'not-started'; // not-started, in-progress, done
	}
	
	awValidate.prototype = {
		addLock : function (type, id, lockSave) {
			var obj = this;

			if (typeof lockSave == "undefined") lockSave = true; // the old default was to lock the save buttons

			// sanity check if it's a known 'type' coming in
			if (typeof obj.messageMap[type] == "undefined") {
				alert("ERROR: PageValidate Configuration error: unknown type [" + type + "]");
				return false;
			}

			if (typeof obj.locks[type] == "undefined")
				obj.locks[type] = {};
			obj.locks[type][id] = 1;

			obj.lockSave[type] = lockSave;
		},

		// see also addAsyncValidation and addLocalAsyncValidation
		addValidation : function (name, rule) {
			var obj = this;

			if (typeof rule == 'function') {
				if (!obj.validationFuncMap[name]) {
					obj.validationFuncMap[name] = new Array;
				}
				obj.validationFuncMap[name].push(rule);
			}
			else {
				if (!obj.validationRuleMap[name]) {
					obj.validationRuleMap[name] = new Array;
				}
				obj.validationRuleMap[name].push(rule);
			}
		},

		blur : function () {
			aw$(this).blur();
		},

		checkLocks : function () {
			var obj = this;
			var ok = true;
			aw$.each(obj.locks, function (type, val) {
				// if this is a Save or Save and Exit and lockSave is off for this type, skip it
							if (AW_Navigate.isPageSave() || AW_Navigate.isExit())
					if (!obj.lockSave[type])
						return;
				var message = obj.messageMap[type];
				ok = false;
				alert(message);
			});
			return ok;
		},

		checkValidation : function () {
			var obj = this;
			var ok = true;

			awConsole("check validation");

			aw$.each(obj.validationRuleMap, function (name, ruleArray) {
				aw$.each(ruleArray, function (i, func) {
				})
			});
			aw$.each(obj.validationFuncMap, function (name, funcArray) {
				aw$.each(funcArray, function (i, func) {
					awConsole("calling func for " + i);
					// 5/28/13 Eric: Added this to fix a problem with intermittant "ok" returned values.
					if(func() == false)
					{
						awConsole("...func for " + i + " returned false");
						ok = false;
						return false;
					}
					awConsole("...func for " + i + " returned something other than false");
				});
			});

			awConsole("check validation: returning ok: [" + ok + "]");
			return ok;
		},

		clearLock : function (type, id) {
			var obj = this;
			if (typeof obj.locks[type] != "undefined")
				if (typeof obj.locks[type][id] != "undefined")
					delete obj.locks[type][id];
			if (aw$.isEmptyObject(obj.locks[type]))
				delete obj.locks[type];
		},

		// NOTE: this doesn't lock down search buttons
		disableNav : function () {
			var nav_next = $(":submit[name=APPSEND]");
			awConsole("awPageNavigate.enableNav(): disabling nav");
			
			this.textMap.prevSubmitText = nav_next.val();
			$(":submit.ufe-nav-btn").not(nav_next).prop("disabled", true);
			if (AW_Navigate.isSend())
				nav_next.hide().bind('focus', this.blur).before('<span class="ufe-submitting-txt">' + this.textMap.submitText + '</span>');
			else
				nav_next.prop("disabled", true);
			this.setTempNavField();
			AW_Navigate.disabled = true; // disables image nav
		},
		
		enableNav : function () {
			awConsole("awPageNavigate.enableNav(): enabling nav");
			$(":submit.ufe-nav-btn").prop("disabled", false);
			aw$("span.ufe-submitting-txt").remove();
			$("[name=APPSEND]").unbind('focus', this.blur).show();
			this.removeTempNavField();
			AW_Navigate.disabled = false; // re-enables image nav
		},

		enableValidation : function () {
			var obj = this;

			if (aw$('form#ufe-main-form').attr('onsubmit')) {
				if (window.location.href.match(/webdev\.unival\.com/))
					alert("Warning: there's javascript attached to the form tag via the onsubmit attribute. " +
					"This may or may not cause issues with the engine's validation code; please " + 
					"consider using AW_Validate.add_validation or the <javascript> FML tag instead.");
			}

			aw$(function () {
				aw$(AW_Navigate.AWForm).submit(function () {
					return obj.validate();
				});
			});
		},

		validate : function () {
			var obj = this;

			if (!AW_Navigate.disabled)
				obj.disableNav();

			var locksOk = obj.checkLocks();
			var validOk = obj.checkValidation();

			var ok = (locksOk && validOk);
			if (!ok) {
				obj.enableNav();
				return false;
			}

			// only do async if we have it
			if (obj.hasAsyncValidation()) {
				if (obj.asyncValidationStatus == 'not-started') {
					obj.startAsyncValidation();
					// don't re-enable nav, but block submit, we'll pick up later
					return false;
				}
				else if (obj.asyncValidationStatus == 'in-progress') {
					// this shouldn't happen
					return false;
				}
				else if (obj.asyncValidationStatus == 'done') {
					// this should only be necessary if one or more calls are in manual finish mode
					// but it shouldn't be too expensive to always call
					if (obj.checkAsyncValidationAllValid()) {
						awConsole("passed final async recheck, returning true");
						return true;
					}
					else {
						obj.resetAsyncValidation();
						obj.enableNav();
						return false;
					}
				}
				else {
					alert("ERROR: unrecognized asyncValidationStatus");
					return false;
				}
			}

			awConsole("validate: returning [" + ok + "]");
			return ok;
		},

		/* ------------------------------ */

		generateTempNavField : function (name, value) {
			var obj = this;
			obj.tempNavField = aw$("<input type='hidden' name='" + name + "' value='" + value + "' />").appendTo(AW_Navigate.AWForm);
		},

		removeTempNavField : function () {
			var obj = this;
			aw$(obj.tempNavField).remove();
		},

		setTempNavField : function () {
			var obj = this;
			if (AW_Navigate.lastClicked == 'PAGE')
				obj.generateTempNavField('p', AW_Navigate.toPage);
			else
				obj.generateTempNavField(AW_Navigate.lastClicked, 1);
		},

		/* ------------------------------ */

		addLocalAsyncValidation : function (name, func, finishMode) {
			var obj = this;

			if (!func || typeof func != 'function') {
				alert("ERROR: func param must be defined as a function for name [" + name + "]");
			}

			if (finishMode != 'manual' && finishMode != 'auto') {
				finishMode = 'auto';
			}

			obj.asyncValidationMap[name] = {};
			obj.asyncValidationMap[name]['type'] = 'local';
			obj.asyncValidationMap[name]['func'] = func;
			obj.asyncValidationMap[name]['finishMode'] = finishMode;
			obj.asyncValidationMap[name]['status']     = 'not-started'; // not-started, in-progress, async-error, valid, invalid
		},

		/* ------------------------------ */

		addAsyncValidation : function (name, method, url, params, func, finishMode) {
			var obj = this;

			// not supporting multiple asyncs per name
			if (obj.asyncValidationMap[name]) {
				alert("ERROR: registering more than one async validation for name [" + name + "]");
				return;
			}

			if (!func || typeof func != 'function') {
				alert("ERROR: func param must be defined as a function for name [" + name + "]");
			}

			if (finishMode != 'manual' && finishMode != 'auto') {
				finishMode = 'auto';
			}

			obj.asyncValidationMap[name] = {};
			obj.asyncValidationMap[name]['type']       = 'ajax';
			obj.asyncValidationMap[name]['method']     = method;
			obj.asyncValidationMap[name]['url']        = url;           // note, can be function or string
			obj.asyncValidationMap[name]['params']     = params;        // note, can be function or object/map
			obj.asyncValidationMap[name]['func']       = func;          // function (data, textStatus, jqXHR) {
			obj.asyncValidationMap[name]['finishMode'] = finishMode;    // automatic or manual
			obj.asyncValidationMap[name]['status']     = 'not-started'; // not-started, in-progress, async-error, valid, invalid
		},

		hasAsyncValidation : function () {
			var obj = this;
			var size = 0, key;
			for (key in obj.asyncValidationMap) {
				if (obj.asyncValidationMap.hasOwnProperty(key)) size++;
			}
			return size;
		},

		startAsyncValidation : function () {
			var obj = this;
			awConsole("starting async validation");
			// reset all the statuses
			aw$.each(obj.asyncValidationMap, function (name, map) {
				obj.asyncValidationMap[name]['status'] = 'not-started';
			});
			// set the "master" status
			obj.asyncValidationStatus = 'in-progress';
			aw$.each(obj.asyncValidationMap, function (name, map) {
				if (map['type'] == 'local') {
					obj.asyncValidationMap[name]['status'] = 'in-progress';
					awConsole("calling 'local' async validation for [" + name + "]");
					var valid = map['func'].call(obj);
					if (map['finishMode'] == 'auto') {
						if (!valid) {
							awConsole("got invalid result when calling async function [" + name + "], aborting val");
							obj.abortAsyncValidation();
						}
						else {
							awConsole("got invalid result when calling async function [" + name + "], setting status");
							obj.setAsyncValidationStatus(name, valid);
						}
					}
					else {
						awConsole("finishMode is manual for [" + name + "]");
					}
					return;
				}

				var url = (typeof map['url'] == 'function') ? map['url'].call() : map['url'];
				var params = (typeof map['params'] == 'function') ? map['params'].call() : map['params'];
				awConsole("calling remote async validation for [" + name + "]");
				obj.asyncValidationMap[name]['jqXHR'] = aw$.ajax({
					type: map['method'],
					cache: false,
					url: url,
					data: params,
					dataType: 'json',
					success: function (data, textStatus, jqXHR) {
						// first arg to call() will set value of "this"...passing in AW_Validate object
						var valid = map['func'].call(obj, data, textStatus, jqXHR);
						awConsole("async func for [" + name + "] returned " + valid);

						// if handling this manually, let the user/caller handle finishing and enabling nav
						if (map['finishMode'] == 'manual') {
							awConsole("finish mode for [" + name + "] is manual, not updating status");
							return;
						}

						obj.setAsyncValidationStatus(name, valid);
						if (valid) {
							obj.continueAsyncValidation(name);
						}
						else {
							obj.abortAsyncValidation(name);
						}
					},
					error: function (jqXHR, textStatus, errorThrown) {
						if (textStatus == 'abort') return;
						obj.asyncValidationMap[name]['status'] = 'async-error';
						awConsole("Async error");
						obj.abortAsyncValidation(name);
						alert("ERROR: while calling async validation for [" + name + "]: [" + jqXHR.status + " "  + textStatus + "]: " + errorThrown);
					}
				});

				obj.asyncValidationMap[name]['status'] = 'in-progress';
			});
		},

		continueAsyncValidation : function (name) {
			var obj = this;
			awConsole("continueAsyncValidation called");
			if (obj.checkAsyncValidationComplete(name)) {
				//if we're done...
				awConsole("check statuses indicated done, about to finish");
				obj.finishAsyncValidation();
			}
		},

		setAsyncValidationStatus : function (name, valid) {
			var obj = this;
			var statusText = (valid ? 'valid' : 'invalid');
			obj.asyncValidationMap[name]['status'] = statusText;
			awConsole("set async status for [" + name + "] to [" + statusText + "]");
		},

		checkAsyncValidationComplete : function (callingName) {
			var obj = this;
			var done = true;
			awConsole("checking async validation completeness");
			aw$.each(obj.asyncValidationMap, function (name, map) {
				if (name == callingName) return;
				// don't have to check for error because error aborts
				awConsole("checking completion status for callingName " + callingName + ": checking name: " + name + ", status is: " + map['status']);
				if (!map['status'] || map['status'] == 'not-started' || map['status'] == 'in-progress') done = false;
			});
			awConsole("checked statuses: done: " + done);
			if (done) {
				obj.asyncValidationStatus = 'done';	
			}
			return done;
		},

		checkAsyncValidationAllValid : function () {
			var obj = this;
			var valid = true;
			awConsole("checking async validation all valid");
			aw$.each(obj.asyncValidationMap, function (name, map) {
				if (!valid) return; // short circuit
				// don't have to check for error because error aborts
				awConsole("(re-)checking validity for name: " + name + ", status is: " + map['status']);
				if (!map['status'] || map['status'] != 'valid') valid = false;
			});
			awConsole("checked all validity: valid: " + valid);
			return valid;
		},

		abortAsyncValidation : function (callingName) {
			var obj = this;
			awConsole("aborting");
			aw$.each(obj.asyncValidationMap, function (name, map) {
				if (name == callingName) return;
				map['status'] = 'not-started';
				if (map['type'] == 'local') return;
				map['jqXHR'].abort();
			});
			obj.asyncValidationStatus = 'not-started';
			obj.enableNav();	
		},

		// very similar to abort
		resetAsyncValidation : function () {
			var obj = this;	
			aw$.each(obj.asyncValidationMap, function (name, map) {
				map['status'] = 'not-started';
			});
			obj.asyncValidationStatus = 'not-started';
		},

		finishAsyncValidation : function () {
			var obj = this;
			awConsole("finishAsyncValidation called, submitting form");
			aw$(AW_Navigate.AWForm).submit();
		},

		log : function (msg) {
			awConsole("AW_Validate.log is deprecated, use awConsole instead");
			awConsole(msg);
		}
	};
	
	return awValidate;
})(aw$);