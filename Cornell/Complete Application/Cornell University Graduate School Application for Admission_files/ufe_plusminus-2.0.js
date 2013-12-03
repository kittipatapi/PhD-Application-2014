(function($)
{
	"use strict";
	
	var crxdata_pattern = /\<[bB]\>\[/,
		crxinput_pattern = /\<[bB]\>\[|\[---\]|\[&nbsp;\]/,
		data_class_pattern = /(^|\s)ufe-data-error(\s|$)/;
	
	// Extend jQuery's selectors
	$.extend($.expr[":"], {
		// create ":formdata" jQuery pseudo selector that returns true for form controls that actually have data entered.
		formdata: function(elem) // expression, collection
		{
			return ((elem.type == "text" || elem.type == "password" || elem.nodeName == "TEXTAREA" || elem.nodeName == "SELECT") && elem.value != "")
				|| ((elem.type == "checkbox" || elem.type == "radio") && elem.checked == true);
		},
		// create ":crxdata" jQuery pseudo selector that returns true for crx controls that actually have data entered. This selector should only be used on data crx page.
		crxdata: function(elem)
		{
			// Return elements that have "<b>[" or ".ufe-data-error" classes
			return crxdata_pattern.test(elem.innerHTML) || data_class_pattern.test(elem.className);
		},
		// create ":crxinput" jQuery speudo selector that returns true for crx page elements that have inputs. This selector should only be used on data crx page.
		crxinput: function(elem)
		{
			// Return elements that have "<b>[", "[---]", "[&nbsp;]", or ".ufe-data-error" classes
			return crxinput_pattern.test(elem.innerHTML) || data_class_pattern.test(elem.className);
		}
	});
	
	function showPopulatedRows($container)
	{
		var $formdata = $container.filter(":has(:formdata), :has(.ufe-attachment-delete)"); // get any populated rows.
		$container.show(); // show all rows.
		$container.find(".ufe-pmjs-minus-btn, .ufe-pmjs-plus-btn").hide(); // hide all buttons.
		if($formdata.length == 0)
			$formdata = $container.first(".ufe-pmjs-row"); // if no rows are filled it, pretend 1st row is filled in.
		$formdata.last().nextAll(".ufe-pmjs-row").hide(); // hide all rows after the last row populated with data.
		$formdata.last().find(".ufe-pmjs-minus-btn, .ufe-pmjs-plus-btn").show(); // show buttons in last available populated row.
	}
	
	// event handler to add a row
	function plusRow(event)
	{
		var $row = $(this).parents(".ufe-pmjs-row"),
			$next;
		
		// Don't do it if animations are running
		if($row.is(":animated"))
			return;
		
		if(event.data.allow_blank_rows || $row.find(":formdata, .ufe-attachment-delete").length > 0)
		{
			$row.find(".ufe-pmjs-minus-btn, .ufe-pmjs-plus-btn").hide(); // hide buttons in current row.
			$next = $row.next(".ufe-pmjs-row"); // grab our next row.
			$next.add($next.find(".ufe-pmjs-minus-btn, .ufe-pmjs-plus-btn")).fadeIn(); // fade in next row and row's buttons.
		}
		else
		{
			if($row.find(".ufe-pmjs-alert").length > 0) // Don't add it if it already exists.
				return;
			$(this).after(event.data.error_msg).next().delay(2500).fadeOut("fast", function() {$(this).remove()}); // show error message. I tried to make a jquery obj and detach, but it was shifting around.
		}
	}
	
	// event handler to remove a row
	function minusRow(event)
	{
		var $row = $(this).parents(".ufe-pmjs-row");
		
		$row.add($row.find(".ufe-pmjs-minus-btn, .ufe-pmjs-plus-btn")).fadeOut();
		//$row.find("input, select, textarea").each(function() { UFE_SetField.set($(this), ""); });
		$row.find("input, select, textarea").each(function() { UFE_SetField.set($(this), ""); });
		$row.prev(".ufe-pmjs-row").find(".ufe-pmjs-minus-btn, .ufe-pmjs-plus-btn").show();
	}
	
	$.fn.plusMinus = function(settings)
	{
		var options = $.extend({
				layout_type: "table", //("table" | "divs")Required: you must explicitly specify which type you are using.
				minimum_rows: 1, //(1 to x-1, where x == total number of rows)The number of rows that will always be shown and will be excluded from plus minus function.
				button_type: "text", //("text" | "image")"text" creates a button input on the page. "image" uses an img.
				plus_btn_text: "+", // If button_type is "image", this becomes alt text. If button_type is "text", this is the displayed text.
				plus_btn_title_text: "Click to add row", // This is the value of the "title" attribute. It shows on mouseover.
				plus_btn_path: "/aw_img/jsplusminus/plus16-1.png", // If button_type is "image", this is the location of the image.
				minus_btn_text: "-", // If button_type is "image", this becomes alt text. If button_type is "text", this is the displayed text.
				minus_btn_title_text: "Click to remove row", // This is the value of the "title" attribute. It shows on mouseover.
				minus_btn_path: "/aw_img/jsplusminus/minus16-1.png", // If button_type is "image", this is the location of the image.
				allow_blank_rows: true, //(true | false)Setting to "false" prevents adding another row unless data is entered in the current row.
				blank_row_message: "You must complete some information before adding a row." // Error message text when attempting to add rows with "allow_blank_rows" set to false.
			}, settings),
			wait_load_max = 30, /*max calls to waitLoad polling function*/
			wait_load_counter = 0, /*counter for max calls of interval*/
			wait_load_interval = 1000, /*time between polling, in ms*/
			plus_button = $(options.button_type == "image" ?
				"<img src='"+options.plus_btn_path+"' alt='"+options.plus_btn_text+"' class='ufe-pmjs-plus-btn' title='"+options.plus_btn_title_text+"' \/>" :
				"<input type='button' class='ufe-pmjs-plus-btn' value='"+options.plus_btn_text+"' title='"+options.plus_btn_title_text+"' \/>"),
			min_button = $(options.button_type == "image" ?
				"<img src='"+options.minus_btn_path+"' alt='"+options.minus_btn_text+"' class='ufe-pmjs-minus-btn' title='"+options.minus_btn_title_text+"' \/>" :
				"<input type='button' class='ufe-pmjs-minus-btn' value='"+options.minus_btn_text+"' title='"+options.minus_btn_title_text+"' \/>"),
			error_msg = "<span class='ufe-pmjs-alert' style='background-color: #FFFFFF; border: 2px solid #FF0000; color: #FF0000; line-height: 1.5em; padding: 0.5em 1em; position: absolute; width: 200px; text-align: left;'>"+ options.blank_row_message +"</span>";
		
		// if layout table isn't an acceptable value, bail.
		if(options.layout_type != "table" && options.layout_type != "divs")
			return;
  		
		options.minimum_rows--; // make minimum rows 0-index for iteration.
		
		// polling function that waits for file uploads to load.
		function waitLoad($rows, clear)
		{
			if($rows == undefined || $rows.length == undefined || clear == undefined || typeof(clear) != "function")
				return;
			
			if(wait_load_counter > wait_load_max)
				clear();
			else if($rows.find(".ufe-attachment-loading").length > 0)
				wait_load_counter++;
			else if($rows.find("div.ufe-attachment > input[type=file]").length > 0)
			{
				showPopulatedRows($rows);
				clear();
			}
		}
		
		$(this).each(function()
		{
			var $rows,
				$buttons,
				upload_interval,
				$crxdata,
				$formdata,
				$container = $(this),
				table_layout = options.layout_type == "table";
			
			// Do everything for the PAGE INPUT view of the form. Check for hidden input w/ username to make sure it's not in admin print view.
			if($(".ufe-data-error-message").length == 0 && $("input[name='username']").length > 0)
			{
				if(table_layout) // Wildcard selector catches thead, tfoot, or tbody tags. Most browsers also insert tbody automatically.
				{
					//$rows = $container.find(" > tr:has(:input), > * > tr:has(:input), > * > tr:has(div.ufe-attachment), > tr:has(div.ufe-attachment)").addClass("ufe-pmjs-row");
					//$rows = $container.find(" > tr, > tbody > tr").has(":input, div.ufe-attachment").addClass("ufe-pmjs-row");
					
					//$rows = $(" > tr, > * > tr", $container[0]).has(":input, div.ufe-attachment").addClass("ufe-pmjs-row");
					$rows = $($container.prop("rows")).has(":input, div.ufe-attachment").addClass("ufe-pmjs-row");
				}
				else
					$rows = $container.find(".ufe-pmjs-row").has(":input, .ufe-attachment");
				
				if($rows.length <= (options.minimum_rows + 1))
					options.minimum_rows = $rows.length - 2; // Override if the setting is higher than the actual number of rows.
				$rows = $rows.slice(options.minimum_rows);
				
				//if($rows.find(".ufe-pmjs-buttons").length == 0)
				//	$rows.append(table_layout ? "<td><div class='ufe-pmjs-buttons'></div></td>" : "<div class='ufe-pmjs-buttons'></div>");
				$buttons = $rows.find(".ufe-pmjs-buttons");
				if($buttons.length == 0)
					$buttons = $(table_layout ? "<td><div class='ufe-pmjs-buttons'></div></td>" : "<div class='ufe-pmjs-buttons'></div>").appendTo($rows);
				
				//$rows.slice(0, -1).find(".ufe-pmjs-buttons").append(plus_button);
				//$rows.slice(1).find(".ufe-pmjs-buttons").append(min_button);
				$(plus_button).appendTo($buttons.slice(0, -1)).click({ allow_blank_rows: options.allow_blank_rows, error_msg: error_msg }, plusRow); // Attach plus button click events
				$(min_button).appendTo($buttons.slice(1)).click(minusRow); // Attach minus button click events
				
				if(typeof(awFileUpload) == "function" && $rows.find(".ufe-attachment-loading, input[type=file]").length > 0)
				{
					upload_interval = setInterval(waitLoad, wait_load_interval, $rows, function() //callback
					{
						// I need to pass a callback to clear the interval because waitLoad function is defined
						// outside the scope that upload_interval is defined.
						clearInterval(upload_interval);
					});
				}
				
				// Events that should happen when the form is submitting
				AW_Validate.addValidation("aw_onsubmit", function()
				{
					// Give the radios a blank value and mark them checked.
					$rows.find("input[type='radio']:hidden").prop("value", "").prop("checked", true);
					// Enable text inputs so that the value will post on submit.
					$rows.find(":input:hidden:disabled").prop("disabled", false);
					
					return true;
				});
				
				showPopulatedRows($rows);
				
				//$buttons.find(".ufe-pmjs-plus-btn").click({ allow_blank_rows: options.allow_blank_rows, error_msg: error_msg }, plusRow); // Attach plus button click events
				//$buttons.find(".ufe-pmjs-minus-btn").click(minusRow); // Attach minus button click events
				return;
			}
			// Do everything for DATA CRX page or admin print view.
			// Get the rows for table layout
			$rows = table_layout ?
				//$container.find("> * > tr, > tr").filter(":crxinput").addClass("ufe-pmjs-row") :
				$($container[0].rows).has(":crxinput").addClass("ufe-pmjs-row") :
				$container.find(".ufe-pmjs-row:crxinput");
			$rows.filter(function(index)
			{
				return index >= options.minimum_rows; // Only return the rows past the minimum
			});
			$crxdata = $rows.has(":crxdata");
			// Test to see if there are any actual completed rows
			if($crxdata.length >= 1)
				$rows.not($crxdata).filter(".ufe-pmjs-row").hide(); // Hide all rows after last completed row
			else // If there aren't completed rows, hide them all.
				$rows.slice(1).hide();
		});
	}
})(aw$);