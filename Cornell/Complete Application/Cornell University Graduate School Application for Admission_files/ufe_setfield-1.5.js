// (c) 2012 CollegeNET Inc.
// written by Eric Fee

; var UFE_SetField = (function($)
{
	"use strict";
	
	var idCounter = 1000, // unique ids to track layers.
		boundElements = [], // list of setfield bound items
		boundClass = "ufe-setfield";
	
	// copy: takes element name, returns a function (to defer until call) which returns the value of an element.
	window.copy = function(name)
	{
		var $e = UFE_SetField.getElement(name);
		return function() { return UFE_SetField.getValue($e); };
	};
	
	
	/* setField: Adaptive-display style wrapper function. Takes an object full of parameters.
	 * params = {
	 *	params.trigger: (String) Name of trigger variable. Either params.selector or params.trigger are required.
	 *	params.selector: (String) Selector for finding a trigger element. Either params.selector or params.trigger are required.
	 *	params.rule: (String, Function, Boolean) Optional. Rule string or function which determines when to set values. Defaults to always set on trigger.
	 *	params.clear: (Boolean) Optional. Clears values when rule is false. Defaults to false/never clear.
	 *  params.lock: (Boolean) Optional. Locks (disables) an element which has been successfully set.
	 *	params.values: (Associative Object) Defines name/value pairs for setting or copying data.
	 * 		Ex: { "&FORMCODE;-MY_FIELD.1": "Some value.", "&FORMCODE;-MY_FIELD.2": copy("&FORMCODE;-MY_FIELD.3") }
	 * }
	*/
	window.setField = function(params)
	{
		var $t, options = {};
		
		if(params.values == undefined || (params.trigger == undefined && params.selector == undefined))
		{
			awConsole("error", "setField: Incomplete parameters.");
			return;
		}
		
		if(params.rule == undefined)
			params.rule = true;
		if(params.clear != undefined)
			options.clear = params.clear;
		if(params.lock != undefined)
			options.lock = params.lock;
		if(params.lockClass != undefined)
			options.lockClass = params.lockClass;
		if(params.onload != undefined)
			options.onload = params.onload;
		
		aw$(function()
		{
			
			$t = params.selector != undefined ? aw$(params.selector) : UFE_SetField.getElement(params.trigger);
			if($t.length == 0)
			{
				awConsole("error", "setField: Could not find trigger elements (may not be on this page.)");
				return; // silently return, there are many normal instances in which we do not have a trigger element to attach to.
			}
			
			UFE_SetField.setField($t, params.rule, params.values, options);
		});
	};
	
	function handleEvent(event)
	{
		var $e, val,
			d = event.data,
			res = UFE_SetField.conditionResult(d.trigger, d.condition);
		
		for(var key in d.values)
		{
			if(!d.values.hasOwnProperty(key))
				continue;
			
			$e = d.values[key].target;
			if(res)
			{
				// the value to set (function or string. the functions should be from copy(), but technically it could be anything.)
				val = typeof(d.values[key].value) == "function" ? d.values[key].value($e) : d.values[key].value;
				
				// 10/10/12 Eric: Added a unique id for tracking--previous multiple autopop events would override target elements. This tracking id disallows that.
				$e.data("setId", d.id);
				UFE_SetField.set($e, val); // set value to $e element.
				if(d.options.lock)
					UFE_SetField.lock($e, d.options.lockClass);
			}
			else if($e.data("setId") == d.id)
			{
				$e.removeData("setId");
				if(d.options.clear)
					UFE_SetField.set($e, ""); // if we're clearing and our condition res returns false, set field to a blank string.
				if(d.options.lock)
					UFE_SetField.unlock($e, d.options.lockClass);
			}
		}
		if(res && typeof(d.options.onCopy) == "function")
			d.options.onCopy();
		else if(!res && typeof(d.options.onClear) == "function")
			d.options.onClear();
	}
	
	function handleChanged()
	{
		var d, t, res, val;
		
		for(var i = 0; i < boundElements.length; i++)
		{
			d = boundElements[i];
			for(var j = 0; j < d.values.length; j++)
			{
				t = d.values[j].target;
				if(t.data("setfield_Change") === true)
				{
					res = UFE_SetField.conditionResult(d.trigger, d.condition);

					if(res)
					{
						// the value to set (function or string. the functions should be from copy(), but technically it could be anything.)
						val = typeof(d.values[j].value) == "function" ? d.values[j].value(t) : d.values[j].value;
						
						// 10/10/12 Eric: Added a unique id for tracking--previous multiple autopop events would override target elements. This tracking id disallows that.
						t.data("setId", d.id);
						UFE_SetField.set(t, val); // set value to $e element.
						if(d.options.lock)
							UFE_SetField.lock(t, d.options.lockClass);
					}
					else if(t.data("setId") == d.id)
					{
						t.removeData("setId");
						if(d.options.clear)
							UFE_SetField.set(t, ""); // if we're clearing and our condition res returns false, set field to a blank string.
						if(d.options.lock)
							UFE_SetField.unlock(t, d.options.lockClass);
					}
					if(res && typeof(d.options.onCopy) == "function")
						d.options.onCopy();
					else if(!res && typeof(d.options.onClear) == "function")
						d.options.onClear();
					
					t.data("setfield_Change", false);
				}
			}
		}
	}
	
	AW_Validate.addValidation("ufe_setfield", function()
	{
		awConsole("debug", "UFE_SetField: unload(): Unloading--unlocking elements for form submission.");
		
		try
		{
			if(UFE_CSV && UFE_CSV.Status() == "Fail")
			{
				awConsole("debug", "UFE_SetField: unload(): UFE_CSV.Status reports validation failure. Cancelling unload.");
				return false;
			}
		}
		catch(e)
		{
			awConsole("debug", "UFE_SetField: unload(): Could not obtain UFE_CSV status, w/ error: "+e);
		}
		
		for(var i = 0; i < boundElements.length; i++)
			if(boundElements[i].options.lock != undefined && boundElements[i].options.lock == true)
				for(var j = 0; j < boundElements[i].values.length; j++)
					UFE_SetField.unlock(boundElements[i].values[j].target);
		
		return true;
	});
	
	return {
		version: "1.5",
		// debugging toggle. - no longer used
		debug: false,
		/* setField function validates arguments and binds our event to our triggering element.
		 * $trigger: jquery object for trigger element
		 * condition: condition string or function on when to execute a copy
		 * values: an associative object representing NAME: VALUE pairs
		 * options: object that may or may not contain "clear" and "lock"
		*/
		setField: function($trigger, condition, values, options)
		{
			var data, $e;
			
			if(typeof($trigger) != "object" || condition == undefined || typeof(values) != "object")
			{
				awConsole("error", "Ufe_SetField.setField: Incomplete parameters.");
				return;
			}
			if(options == undefined)
				options = {};
			
			if(options.lockClass == undefined)
				options.lockClass = "ufe-readonly";
			
			if(options.onload == undefined)
				options.onload = false;
			
			data = {
				"trigger": $trigger,
				"condition": condition,
				"values": [],
				"options": options,
				"id": idCounter,
				"timer": null
			};
			
			for(var i in values)
			{
				if(values.hasOwnProperty(i))
				{
					$e = UFE_SetField.getElement(i).addClass(boundClass);
					if($e.length > 0)
						data.values.push({ target: $e, value: values[i] });
					else
						awConsole("debug", "UFE_SetField.setField(): Missing element: ", i);
				}
			}
			
			idCounter += 1;
			
			$trigger.addClass(boundClass).
				on("setfield_Change", handleChanged).
				on(UFE_SetField.handlerType($trigger), data, handleEvent);
			
			boundElements.push(data);
			
			if(data.condition != undefined
				&& data.condition != ""
				&& data.condition !== true
				&& data.options.onload === true
				&& UFE_SetField.conditionResult(data.trigger, data.condition))
					data.trigger.triggerHandler(UFE_SetField.handlerType(data.trigger));
		},
		conditionResult: function($trigger, test)
		{
			var res = false, // the result (true/false hopefully) of our condition arg. We allow anonymous functions to be passed for more advanced conditions.
				trigger = UFE_SetField.getValue($trigger);
			try
			{
				res = typeof(test) == "function" ? test($trigger) : eval(test);
				if(res !== true && res !== false)
					res = false;
			}
			catch(error)
			{
				awConsole("error", error);
			}
			return res;
		},
		// handlerType: takes a jquery object and returns the handler type for binding
		handlerType: function($e)
		{
			var tag;
			
			if($e == undefined || $e.length == 0)
			{
				awConsole("debug", "SetField.handlerType: Element not found: ", $e);
				return;
			}
			
			tag = $e.prop("nodeName").toLowerCase();
			
			if((tag == "input" && $e.attr("type") == "text") || tag == "textarea")
				return "keyup";
			
			if(tag == "select")
				return "change";
			
			return "click";
		},
		triggerHandlers: function($e)
		{
			$e.triggerHandler(UFE_SetField.handlerType($e));
			if($e.data("chosen") != undefined)
				$e.trigger("liszt:updated"); // chosen update.
		},
		// getElement: Takes an element name and returns the associated element on page as a jquery object.
		getElement: function(name)
		{
			var t = $.type(name),
				$e;
			
			if(t == "object" && name.jquery != undefined)
				return name;
			
			if(t == "array" && name.length > 0)
			{
				$e = UFE_SetField.getElement(name[0]);
				for(var i = 1; i < name.length; i++)
					$e = $e.add(UFE_SetField.getElement(name[i]));
				
				return $e;
			}
			
			$e = $(document.getElementById(name)); // attempt to find element by ID
			
			if($e.length > 0)
				return $e;
			
			$e = $(document.getElementsByName(name));
			
			if($e.length > 0) // if we didn't find it by ID, check by name, if so return that.
			{
				if($e.length > 1 && ($e.is(":checkbox") || $e.is(":radio")))
					$e = $e.not("[type=hidden]");
				return $e;
			}
			
			if(document.getElementsByName("mdy1__"+name).length > 0) // wooo date fields.
				return $("[name='mdy1__"+name+"'], [name='mdy2__"+name+"'], [name='mdy3__"+name+"']");
			
			else if(document.getElementsByName("ssnum1__"+name).length > 0) // ssn fields.
				return $("[name='ssnum1__"+name+"'], [name='ssnum2__"+name+"'], [name='ssnum3__"+name+"']");
			
			return $e;
		},
		// set: set $target to value. I don't know how to better explain it!
		set: function($target, value)
		{
			var day, month, year,
				$day, $month,
				setVals, tag, type;
			
			if($target.length == 0) // if our element list is empty, exit with error.
			{
				awConsole("error", "Ufe_SetField.set: No Element Found");
				return;
			}
			tag = $target.eq(0).prop("nodeName").toLowerCase(); // tag of the element we're dealing with.
			type = $target.eq(0).prop("type").toLowerCase();
			
			if(tag == "input" && type == "file" && value == "")
				UFE_SetField.clearUpload($target);
			
			if((tag != "input" && tag != "select" && tag != "textarea") || type == "submit" || type == "button" || UFE_SetField.getValue($target) == value)
				return;
			
			// to do (maybe??), get value of SSN fields. maybe not.
			if($target.attr("name") != undefined && $target.attr("name").match(/^mdy1__/) != null) // check if we're working with date fields.
			{
				// if we're clearing values, then get that out of the way...
				if(value == null || value == "")
				{
					$target.val("");
					UFE_SetField.triggerHandlers($target);
					return;
				}
				
				// to fix: also need to check if it's a JS Date obj, not just string
				if(typeof(value) == "string") // we accept YYYY-MM-DD and YYYYMMDD strings.
				{
					value = value.replace(/\-/g, "");
					if(value.length != 8)
					{
						awConsole("error", "UFE_SetField.set: Invalid date.");
						return;
					}
					year = value.substr(0, 4);
					month = value.substr(4, 2);
					day = value.substr(6, 2);
				}
				else // or we accept javascript Date objects.
				{
					day = value.getDate().toString();
					month = (value.getMonth() + 1).toString();
					year = value.getFullYear();
				}
				
				// for month and day, if we're working with a select list, set it accordingly. Else just set the value.
				$month = $target.filter("[name^='mdy1__']");
				if($month[0].nodeName.toLowerCase() == "select")
					$month.val(month.length == 1 ? "0"+month : month);
				else
					$month.val(month);
				
				$day = $target.filter("[name^='mdy2__']");
				if($day[0].nodeName.toLowerCase() == "select")
					$day.val(day.length == 1 ? "0"+day : day);
				else
					$day.val(day);
				
				UFE_SetField.triggerHandlers($target);
				$target.filter("[name^='mdy3__']").val(year); // set =)year.
			}
			else // non-date fields
			{
				// if we're dealing with a radio set or checkbox set. (the 0th element in a checkbox set is a hidden which is automatically injected.)
				if(tag == "input" && $target.eq(0).attr("type").toLowerCase() == "radio")
				{
					if(value == "")
					{
						var injectBlank = true;
						$(document.getElementsByName($target.prop("name"))).each(function()
						{
							$(this).prop("checked", false);
							if($(this).val() == "")
							{
								$(this).prop("checked", true);
								injectBlank = false;
							}
						});
						if(injectBlank)
							$("<input type='radio' style='display:none;' value='' name='"+$target.prop("name")+"' checked='checked'>").appendTo("form");
					}
					else
					{
						// for radio or checkbox sets, we'll iterate over all of them, checking the correct one
						$target.each(function()
						{
							if($(this).val() == value)
								$(this).prop("checked", true);
							else if(value == "") // if we're clearing a value, we'll uncheck the item.
							{
								$(this).prop("checked", false);
							}
						});
					}
					
					for(var i = 0; i < $target.length; i++)
						UFE_SetField.triggerHandlers($target.eq(i));
				}
				else if(tag == "input" && (($target.length > 1 && $target.eq(1).attr("type").toLowerCase() == "checkbox") || $target.eq(0).attr("type").toLowerCase() == "checkbox"))
				{
					setVals = value.split(",");
					for(var i in setVals)
					{
						if(!setVals.hasOwnProperty(i))
							continue;
						setVals[i] = $.trim(setVals[i]);
					}
					
					// for radio or checkbox sets, we'll iterate over all of them, checking the correct one
					$target.each(function()
					{
						if($.inArray($(this).val(), setVals) > -1)
							$(this).prop("checked", true);
						//else if(value == "") // if we're clearing a value, we'll uncheck the item.
						/*
							Issue: When we call set() on a checkbox array (more than 1): Should we uncheck values not sent?
								I believe that it is more useful to do so, rather than set a value as checked and leave
								all other checkboxes in their current state.
						*/
						else
							$(this).prop("checked", false);
					});
					
					for(var i = 0; i < $target.length; i++)
						UFE_SetField.triggerHandlers($target.eq(i));
				}
				else // textarea, text input, select list...
				{
					$target.val(value);
					UFE_SetField.triggerHandlers($target);
				}
			}
		},
		clearInputs: function($p)
		{
			if(!UFE_SetField.isjQuery($p))
				return awConsole("debug", "UFE_SetField.clearInputs: $p is not a jQuery object: ", $p);
			$p.add($p.find("input,select,textarea")).filter("input,select,textarea").each(function()
			{
				UFE_SetField.set($(this), "");
			});
		},
		// clears new file uploads by clicking the "remove" button. -- this should be passed on the $(input[type=file]) of associated file to remove.
		clearUpload: function($e)
		{
			var removeButton;
			// if we're given a string for $e, make it into a jquery element.
			if(typeof($e) != "object")
				$e = UFE_SetField.getElement($e);
			
			removeButton = $e.siblings(".ufe-attachment-files").find(".ufe-attachment-delete button");
			if(awFileUpload && $e.prop("tagName").toLowerCase() != "input" || $e.prop("type").toLowerCase() != "file" || removeButton.length == 0)
				return; // I realize that typically this check/return wouldn't be necessary but I don't want any weird situations to arise.
			
			removeButton.click();
		},
		// getValue: Takes: jquery object representing an element. Return a sensible value for element $e.
		isjQuery: function(obj)
		{
			return ($.type(obj) === "object" && typeof(obj.jquery) === "string");
		},
		getValue: function($e)
		{
			var tag, type, vals,
				day, month, year,
				val = null;
			
			// if we're given a string for $e, make it into a jquery element.
			if(typeof($e) != "object")
				$e = UFE_SetField.getElement($e);
			
			// if we can't find any objects in $e...fail silently, return empty string.
			if($e.length == 0)
				return val;
			
			// if the tag is not input, select, or textarea -- we can't get a sensible value. return empty string.
			tag = $e.eq(0).prop("nodeName").toLowerCase();
			type = $e.eq(0).prop("type").toLowerCase();
			if((tag != "input" && tag != "select" && tag != "textarea") || type == "submit" || type == "button")
				return val;
			
			// oh joy date fields.
			if($e.attr("name") != undefined && /^mdy1__/.test($e.attr("name")))
			{
				month = parseInt($e.filter("[name^='mdy1__']").val());
				day = parseInt($e.filter("[name^='mdy2__']").val());
				year = parseInt($e.filter("[name^='mdy3__']").val());
				
				// added to catch less than four digit years
				if(year < 1000) 
					return null;
				
				if(!isNaN(month) && !isNaN(day) && !isNaN(year))
					val = year+"-"+(month < 10 ? "0"+month : month)+"-"+(day < 10 ? "0"+day : day);
			}
			else
			{
				// we have a checkbox array...we'll return a somewhat sensible string value...
				if(tag == "input" && (type == "checkbox" || ($e.length > 1 && $e.eq(1).prop("type").toLowerCase() == "checkbox")))
				{
					vals = [];
					$e.filter("[type=checkbox]:checked").each(function()
					{
						vals.push($(this).val());
					});
					val = vals.join(",");
				}
				else if(tag == "input" && type == "radio") // regular old radio button
					val = $e.filter(":checked").val();
				else if(tag == "select" && type == "select-multiple") // multiple select list.
					val = $e.val().join(",");
				else
					val = $e.val(); // For text input, textarea, select list, hidden
			}
			return val;
		},
		lock: function($target, lockClass)
		{
			if(typeof($target) == "object" && $target.length >= 1)
			{
				$target.addClass(lockClass);
				$target.prop("disabled", true);
				
				// trigger chosen to update view
				$target.trigger("liszt:updated");
			}
		},
		unlock: function($target, lockClass)
		{
			if(typeof($target) == "object" && $target.length > 0)
			{
				$target.prop("disabled", false);
				if(lockClass != undefined)
					$target.removeClass(lockClass);
				
				// trigger chosen to update view
				$target.trigger("liszt:updated");
			}
		}
	}
})(aw$);
