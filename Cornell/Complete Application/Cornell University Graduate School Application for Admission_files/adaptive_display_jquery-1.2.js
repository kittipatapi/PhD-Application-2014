// jQuery Layers (adaptive display)

if (!awLayers) var awLayers = new Array();
var awLayerDefaults = new Object();

// create a new layer, add it to the list
function awLayer(layerObj){
	var layerSettings = {};
	aw$.extend(layerSettings, awLayerDefaults, layerObj);
  awLayers.push(layerSettings);
}

// use the element's id to reference, if that doesn't exist go by name
// this is so that you can specify radios and checkbox sets in a way 
// that is consistent with other element types
function getIdentifier(obj){
  if (aw$('#'+obj).attr('id') == undefined){
    obj = '[name="'+obj+'"]';
  } else {
    obj = '#'+obj;
  } 
  return obj;
}

function evalRule(rule){
	var showState = ((typeof(rule) == "function" || typeof(rule) == "undefined") ? rule() : eval(rule));
	return showState;
}


// infer the options for each layer and apply the layer functionality to them
aw$().ready(function() {  

  aw$.each(awLayers, function(i, o){
    var layerTrigger = aw$(getIdentifier(o.trigger)+'[type!=hidden]:first');
    var layerDisplay = aw$(getIdentifier(o.display));
    layerTrigger.layers({display: layerDisplay, rule: o.rule, effect: o.effect, speed: o.speed, clear:o.clear});
  });
  
  //handle any layers that should be hidden on data correction
  aw$('#ufe-data-crx .hideOnCrx').hide();
});

// do layer stuff
(function(aw$){  
  aw$.fn.layers = function(options) {

	//defaults for all layers everywhere
    var defaults = {  
      rule: 'trigger == "Y"',
      effect: 'fade',
      speed: 'normal',
	  clear: true
    };  
  var options = aw$.extend(defaults, options); 

  function getTriggerVal(obj){    
    if (obj.type == 'checkbox'){
			triggerMult = new Array(); 
			selectedValues = aw$('[name="'+obj.name+'"]:checked');
			aw$.each(selectedValues, function(i,n){
				triggerMult.push(n.value)
			}); 
			trigger = triggerMult.join(", ");
		} else if (obj.type == 'radio'){
			trigger = aw$('[name="'+obj.name+'"]:checked').val();
		} else {
			trigger = obj.value;
		}
  }

	function bindFun(target){
		getTriggerVal(target);
		var display = options.display;
		var rule = options.rule;
  	var effect = options.effect;
  	var speed = options.speed;
		var clear = options.clear;
  	if (evalRule(rule)!=true){
  		switch(effect){
    		case 'slide':
      		display.slideUp(speed,clearHiddenInputs(display,clear));
        	break;
      	case 'fade':
        	display.fadeOut(speed,clearHiddenInputs(display,clear));
        	break;
        case 'none':
          display.hide();
      	default: 
        	display.hide('',clearHiddenInputs(display,clear));
    	}
		} else {
  		switch(effect){
    		case 'slide':
      		display.slideDown(speed);
        	break;
     		case 'fade':
        	display.fadeIn(speed);
        	break;
      	default:
        	display.show();
			}
		}
	}

	//this inserts an empty radio option so that the blanked value will save.
	function createBlankRadio(elem, name){
		//only add the blank radio option once
		if (aw$('#'+name+'_RADIO_CLEAR').length == 0){
			elem.before('<input type="radio" checked="checked" value="" name="'+name+'" id="'+name+'_RADIO_CLEAR" style="display: none;"/>');
		}
		//makes sure the blank radio option is checked (in the case of the if statement above being false)
		aw$('#'+name+'_RADIO_CLEAR').attr('checked', true);
	}

	// clear of all values/selections in elements being hidden
	// and then trigger any javascript bound to hidden elements
  function clearHiddenInputs(target,clear){
		if (clear == true){
			var childInputs = aw$('input, select, textarea', target);
			childInputs.each(function(){
				var thisInput = aw$(this);
				var type = this.type;
				var tag = this.tagName.toLowerCase();
				var name = this.name;
				if (type == 'text' || type == 'password' || tag == 'textarea' || (type == 'hidden' && /^(?!.*PARAMS)/.test(name))){
					this.value = "";
				} else if (type == 'radio'){
					this.checked = false;
					createBlankRadio(thisInput, name);
				} else if (type == 'checkbox'){
					this.checked = false;
				} else if (tag == 'select'){
					this.selectedIndex = 0;
				} 
				
				if (type != 'file' && type != 'button' && type != 'submit') {
					// the setTimeout fixes IE performance and prevents a slow script warning.
					setTimeout(function(){
						thisInput.triggerHandler('keyup');       
						thisInput.triggerHandler('click');       
						thisInput.triggerHandler('change');
						
						// 11/13/12 Eric: added to make chosen trigger updates.
						thisInput.trigger("liszt:updated");
					}, 0);
				}
			}); 
		}
  }

  return this.each(function() {  
    type = this.type;
		tag = this.tagName.toLowerCase();
		getTriggerVal(this);

		// set initial display state
		if (evalRule(options.rule)==true){
    	aw$(options.display).show();
    } else {
    	aw$(options.display).hide();
    }
	
	  // determine which event to bind layer action to
	  if ((tag == "input" && type =='text') || (tag == 'textarea')){
        eventType = 'keyup';
      }else if (tag == "select"){
        eventType = 'change';
	  	}else if (type == "radio" || type == "checkbox" ){
        eventType = 'click';
      } else {
        eventType = 'click';
        aw$(this).css('cursor','pointer');
      } 

	// bind event to entire set of radios/checkboxes
    if ((type == "radio") || (type == "checkbox")){
      	bindTarget = aw$('input[name="'+this.name+'"]');
    	} else {
      	bindTarget = aw$(this);
    	}
    
		// add the event handler to the layer
    bindTarget.bind(eventType+".layers", function(){bindFun(this)});
  });
 };
})(aw$); 
