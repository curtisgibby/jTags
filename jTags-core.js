/* jTags-core.js | Source code | Well commented
 * Author : Matan Tsuberi , Israel , (Github: matantsu)
 * Licence : (GPL) GNU GENERAL PUBLIC LICENSE : https://github.com/matantsu/jTags/blob/master/LICENSE
 * Website : http://matantsu.github.io/jTags
 * Please feel free to change , modify , improve , 
 * fork on GitHub , and use this code in any way you see fit ! */

(function ( $ ) {
	
	/* overview of jTags-core : 
	 * ------------------------
	 * jTags-core is a simple engine that iterates over tags with defined tagNames (in window.jTags)
	 * than executes the function associated with them from the outer-most to the inner-most jTag
	 * the [skip] attribute of the jTag tells the engine whether to skip the execution or not
	 * and when a jTag has done it's task it calles $(this).jend() to terminate itself.
	 *
	 * objects:
	 * --------
	 * window.jTagSettings - default settings.
	 * window.jTags - the object containing the jTag definitions.
	 *
	 * functions:
	 * ----------
	 * $.fn.exec - execute single jTag.
	 * $.fn.execLayer - execute only surface jTags for `order of operations` purpose (jTags without any jTags outside of them).
	 * $.fn.execAll - execute every jTag in the page according to `order of operations`.
	 * 
	 * $.fn.jend - terminate a jTag unwraping it or optionally firstly filling it with content.
	 * $.fn.skip - get or set [skip] attribute of a jTag.
	 * $.fn.jTagError - an error object to throw.
	 * 
	 * events:
	 * -------
	 * pretty much self explainatory
	 *
	 * beforeExec
	 * afterExec
	 *
	 * skip
	 *
	 * beforeExecLayer
	 * afterExecLayer
	 *
	 * beforeExecAll
	 * afterExecAll
	 *
	 * beforeJend
	 * afterJend
	 * */
	
	//jTag's default settings
	window.jTagSettings = {
		execAllAfterJend: true,
		scopeSelector:'html'
	};
	
	//execute single jTag.
	$.fn.exec = function()
	{
		//make sure only one element is handled.
		if(this.length == 0) $(this).jTagError('cannot execute non-existing jTag');
		var e = $(this).first();
		
		/*allows you to skip execution by setting the skip attribute to a number
		 *  indicating how many times to skip or to `true` indicating skip forever */
		var skip = e.skip();
		if(!isNaN(skip)){
			e.skip(skip-1);
			$(e).trigger('skip');
			return 'skip';
		}
		else if(skip === 'true'){
			$(e).trigger('skip');
			return 'skip';
		}
		
		var tagName = e.prop('tagName').toLowerCase();
		
		// get all attributes as a key-value object.
		var attrs = {};
		var elemAttrs = e.get(0).attributes;
		for (var i = 0, len = elemAttrs.length; i < len; i++)
			attrs[elemAttrs[i].name] = elemAttrs[i].value;
		
		//merge jTag's data with attributes to be passed to the jTag function as one , without modifing the actual data.
		var data = $.extend(e.data('jTag-data') , attrs);
		
		var F = jTags[tagName];
		if($.isFunction(F))
		{
			//trigger `beforeExec` event on the element and pass the data
			e.trigger('beforeExec' , data);
			//call the function in the context of this element (this = e)
			F.call(e , data);
			//set [skip=true] the jTag will wait and will not execute again until $(this).jend() is called
			e.attr('skip' , 'true');
			//trigger `afterExec` event globally (because maybe the element has disapeared) and pass the jTag name and the data
			$(window).trigger('afterExec' , [ tagName ,data ]);
		}
		else
			$(e).jTagError('jTag `'+tagName+'` not found');
	};
	
	//execute only surface jTags for `order of operations` purpose (jTags without any jTags outside of them).
	$.fn.execLayer = function()
	{
		var e = this;
		$(e).trigger('beforeExecLayer');
		//generate a query string containing all jTags
		var str = '';
		for (var key in jTags) {
		  if (jTags.hasOwnProperty(key)) {
			  str+=key+',';
		  }
		}
		str = str.substr(0,str.length-1);
		
		//get all jTags inside scope
		$(e).find(str).each(function(i,el){
			// execute only if there are not jTags above the jTag , meaning it's a `top level` jTag 
			if($(el).parents(str).length == 0)
				$(el).exec();
		});
		$(e).trigger('beforeExecLayer');
	};
	
	//execute every jTag in the page according to `order of operations`.
	$.fn.execAll = function()
	{
		var e = this;
		
		$(e).trigger('beforeExecAll');
		//keep executing until nothing changes anymore in HTML meaning there is nothing to execute.
		var preHTML = '' , postHTML = 'a';
		while(preHTML !== postHTML)
		{
			preHTML = $(e).html();
			$(e).execLayer();
			postHTML = $(e).html();
		}
		$(e).trigger('afterExecAll');
	};
	
	//terminate a jTag unwraping it or optionally firstly filling it with content.
	$.fn.jend = function(content)
	{
		var e = this;
		var jTag = $(e).prop('tagName').toLowerCase();
		
		$(e).trigger('beforeJend' , content);
		if(typeof content !== 'undefined')
			$(e).html('').append(content);
		//terminate the tag by replacing it with it's contents and thus exposing any jTags inside it for executing
		$(e).contents().unwrap();
		$(window).trigger('afterJend' , [jTag , content]);
		
		//do we trigger execAll after jend()? default to true , configurable by user in jTagSettings Object
		if(jTagSettings.execAllAfterJend) $(jTagSettings.scopeSelector).execAll();
	};
	
	//get or set [skip] attribute of a jTag.
	$.fn.skip = function(val)
	{
		var e = this;
		
		var e = this;
		
		if(val)
		{
			if(val == 0)
				$(e).removeAttr('skip');
			else if(val == 'once')
				$(e).attr('skip' , 1);
			else if(!isNaN(val))
				$(e).attr('skip' , val);
			else if (val == 'true')
				$(e).attr('skip' , 'true');
			else
				$(e).jTagError('invalid value of `skip` attribute');
		}
		else
			return $(e).attr('skip');
	};
	
	//an error object to throw
	$.fn.jTagError = function(m)
	{
		var val =  { 
		    name:        "jTags Error", 
		    jTag : this,
		    message:     m, 
		    htmlMessage: m,
		    toString:    function(){return this.name + ": " + this.message;} 
		};
		
		throw val;
	};
	
	//the object containing the jTag definitions.
	window.jTags = {
		//name of jTag needs to be lower-case.
		'example-jtag':function(data){
			
			var e = this;
			//data contains $(this).data('jTag-data') merged with the element attributes (attributes override `jTag-data`)
			console.log(data);
			
			//example of doing asynchronous tasks:
			if(data.ajaxurl)
				$.get(data.ajaxurl , function(result)
				{
					//terminate only when the task is truly finished
					$(e).jend(result);
				});
			else
			//if data.ajaxUrl isn't set , then skip and don't do anything , maybe it will be set in the next run.
			$(e).skip('once');
		}
	};
	
	/* write in html : 
	 * <example-jtag ajaxUrl="url/to/another/page.html"></example-jtag>
	 * 
	 * then call: $('html').execAll();
	 * 
	 * and see what happens (hopefully it works)!
	 * (make sure you run from a proper host or localhost and not from `file://path`) */
	
}( jQuery ));
