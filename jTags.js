/* jTags.js | Source code | Well commented
 * Author : Matan Tsuberi , Israel , (Github: matantsu)
 * Licence : (GPL) GNU GENERAL PUBLIC LICENSE : https://github.com/matantsu/jTags/blob/master/LICENSE
 * Website : http://matantsu.github.io/jTags
 * Please feel free to change , modify , improve , 
 * fork on GitHub , and use this code in any way you see fit ! */

/* please contribute comments for other people and send my a pull request on GitHub , thanks in advance)*/

(function ( $ ) {
	
	/* overview of jTags-core : 
	 * ------------------------
	 * window.jTagSettings - default settings.
	 * 
	 * $.fn.exec - execute single jTag.
	 * $.fn.execLayer - execute only surface jTags for `order of operations` purpose (jTags without any jTags outside of them).
	 * $.fn.execAll - execute every jTag in the page according to `order of operations`.
	 * 
	 * $.fn.jend - terminate a jTag unwraping it or optionally firstly filling it with content.
	 * $.fn.skip - get or set [skip] attribute of a jTag.
	 * $.fn.jTagError - an error object to throw.
	 * 
	 * window.jTags - the object containing the jTag definitions.
	 * */
	
	/* overview of the standard jTags : 
	 * --------------------------------
	 * legend : [required] , (optional)
	 * 
	 * new-jtag[name](source) - create a new jTag (get the jTag's function from element HTML or from $.get call).
	 * 
	 * jtag[code] - execute arbitrary code (the code is run as if it was a jTag function).
	 * 
	 * load[action] - load content via $.get and push it to the element.
	 * 
	 * define-fragment[name](source) - define an HTML pattern to be displayed (optionally with parameters) by the `fragment` jTag.
	 * 								   the pattern is retreived from element.html() or via $.get(source).
	 * 
	 * fragment[name](source) - display the HTML pattern and replace parameters of the form `{%paramName [param default]%}` with data.
	 * 						  	the data is retreived according to an order of precedence:
	 * 							1. JSON data from $.get request
	 * 							2. element attribute
     * 							3. $(e).data('jTagData')
     * 							4. default value
     * 							5. error message
     * 
     * repeater(times)(source) - repeat the content. can iterate through array of data objects , pushing the data to all the fragments inside of it.
     * 							 or just repeat a certain amout of `times` (`times` attribute overrides array.length)
     * 
     * content-holder[name] - when there are one or more content-holders the page goes into ajaxBrowsing mode, when the user clicks on a link : 
     * 						  instead of loading the entire page , the page is retreived via $.get and then we look for `<content name="content-holder-name">` tags
     * 						  and we push the tag's content to the appropriate content-holder.
     * 
	 * */
	
	/* overview of the utility functions : 
	 * -----------------------------------
	 * $.fn.textCrawl(regex,callback) - the function recursivly looks for the regex pattern in text and in attribute values , 
	 * 									calling the callback , passing it the string and a set of matches , 
	 * 									then the function replaces the string with the return string from the callback
 	 *									(this function is used to replace the fragment parameters without destroying non-serializable data , such as $(elem).data('jTagData'))
 	 *
 	 * ajaxBrowse(href) - triggers $(window).trigger('beforeAjaxBrowse' , href) and then gets the page via $.get , then looks for `<content name="content-holder-name">` tags and pushes their content to the respective `content-holder`
 	 * 						when the push is successful , the function updates the history (so you can press back and forward on the browser)
 	 * 						and triggers $(window).trigger('afterAjaxBrowse' , href)
 	 * 						(this fucntion is used by the `content-holder` jTag for exactly the above)
 	 * 
 	 * urlParam - gets\sets url query string parameters (...?paramName=paramValue&otherParamName=otherParamValue&...) , 
 	 * 				when using `set` the function returns the new query string but does not actually change the location.href.
 	 * 				(this function is used by the ajaxBrowse function to manipulate the url)
	 * 
	 */
	
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
		var data = $.extend(e.data('jTagData') , attrs);
		
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
		$(e).replaceWith($(e).contents());
		$(window).trigger('afterJend' , [jTag , content]);
		
		//do we trigger execAll after jend()? default to true , configurable by user in jTagSettings Object
		if(jTagSettings.execAllAfterJend) $(jTagSettings.scopeSelector).execAll();
	};
	
	//get or set [skip] attribute of a jTag.
	$.fn.skip = function(val)
	{
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
	
	//the standard jTags
	window.jTags = {
		'new-jtag':function(data){
			var e = this;
			var F = '';
			//name attribute is required
			if(typeof data.name === 'undefined') $(e).jTagError('new-jtag: name not defined');
			
			//if source is specified , get function definition from $.get call , otherwise get it from $(e).html()
			if(data.source){
				$.get(data.source).done(function(result){
					//on succsess 
					F = result;
					newJtag();
				}).fail(function()
				{
					//on fail
					$(e).jTagError('new-jtag: failed retreiving function via $.get ('+data.source+')');
				});
			}
			else {
				F = $(e).html();
				newJtag();
			}
			
			function newJtag(){
				
				//evaluating the function string to get the function itself.
				try{
					F = eval('['+F.trim()+']')[0];}
				catch(er){$(e).jTagError('new-jtag: invalid function definition:' + er);}
				//pushing the new jTag
				jTags[data.name] = F;
				//we want the tag to vanish , not unwrap
				$(e).jend('');
			}
		},
		'jtag':function(data){
			alert('');
			try{eval(data.code);}catch(e){$(this).jTagError('jTag: failed executing code');}
		},
		'load':function(data){
			var e = this;
			if(data.action)
			$.get(data.action).done(function(result){
				//on succsess 
				$(e).jend(result);
			}).fail(function(){
				//on fail
				$(e).jTagError('load: failed loading content: '+data.action);
			});
		},
		'define-fragment':function(data){
			
			if(!data.name)$(this).jTagError('define-fragment: no name is specified');
    		var e = this;
    		var val = '';
    		
    		//this is where we store the fragment information
    		if(!window.fragments) window.fragments = {};
    		
    		if(data.source){
    			$.get(data.source).done(function(result){
    				$(e).html(result);
    				end();
    			}).fail(function(){
    				$(this).jTagError('define-fragment: failed to retreive content via $.get ('+data.source+')');
    			});
			}
    		else
				end();
    		
    		function end(){
    			val = $(e).contents().clone(true);
    			window.fragments[data.name] = val;
    			$(e).jend('');
    		}
		},
		'fragment':function(data){
			
			if(!data.name) {$(this).jTagError('fragment: no name is specified');}
			if(!window.fragments || !window.fragments[data.name]) {
				//if fragment is not found , skip this execution , maybe next time the fragment will be found.
				$(this).skip('once');
				return; 
			};
    		var e = this;
    		
    	   /* the fragment jTag finds patterns of the form {%paramName [param default value] %}
    		* and tries to replace it with the appropriate value from data according to this precedence:
    		* 1. JSON data from $.get request
    		* 2. element attribute
    		* 3. $(e).data('jTagData')
    		* 4. default value
    		* 5. error message
    		* 
    		* since 2 and 3 are already merged in [data] there is no need to merge them.
    		*/
    		
    		//if [source] is specified get parameter data from $.get , otherwise fill parameters according to precedence
    		if(data.source)
    		{
    			$.getJSON(data.source).done(function(json){
    				//on success
    				data = $.extend(data , json);
    				fillParamsAndJend();
    			}).fail(function(){
    				//on fail
    				$(e).jTagError('fragment: falied to retreive JSON object via $.getJSON ('+data.source+')');
    			});
    		}else
    			fillParamsAndJend();
    		
    		function fillParamsAndJend()
    		{
    			//push fragment definition to element
    			$(e).html('').append(window.fragments[data.name].clone(true));
    			
    			//regex for {%paramName [param default value] %}
    			var paramPatt = /{%(\w+) *(\[(?:.|\r|\n)*?\])? *%}/gmi;
    			
    			/* $.fn.textCrawl is a utility for manipulating text and attribute values using regex
    			 * *without* destroying the DOM (like you would using $(this).html().replace()) ,
    			 * it is important because we don't want to destroy things like $(elem).data('jTagData') */
    			$(e).textCrawl(paramPatt , function(str , matches){
    				
    				//iterate through all matches and replace the match on the string with a value
    				for(var i in matches){
    					var match = matches[i];
    					
    					var val = 'error: no value could be found for parameter: `' + match[1] + '`';
    					if(match[2])
            				val = match[2].substr(1,match[2].length-2);
    					if(data[match[1].toLowerCase()])
    						val = data[match[1].toLowerCase()];
    					str = str.replace(match[0] , val);
    				}
    				//return the new string with the parameter values to be replaced
    				return str;
    			});
        		$(e).jend();
    		}
		},
		/* i'm sure you can figure this out ... 
		 * (if you do , please contribute comments for other people and send my a pull request on GitHub , thanks in advance)*/
		'repeater':function(data){
			var e = this;
			
			var array;
			//
			if(data.source)
    		{
    			$.getJSON(data.source).done(function(json){
    				//on success
    				array = $.extend($(e).data('jTagData'),json);
    				repeatAndJend();
    			}).fail(function(){
    				//on fail
    				$(e).jTagError('repeater: falied to retreive JSON object via $.getJSON ('+data.source+')');
    			});
    		}else
    			repeatAndJend();
			
			function repeatAndJend(){
				var length = 0;
				if(array) length = array.length;
				if(data.times) length = data.times;
				if(!length) $(e).jTagError('repeater: no array or no `times` attribute');
				
				var original = $(e).contents();
				$(e).html('');
				for(var i = 0 ; i < length ; i++){
					var c = original.clone(true);
					c.filter('fragment').each(function(r,el){if(array && array[i])$(el).data('jTagData' , array[i]);});
					$(e).append(c);
				}
				$(e).jend();
			}
				
		},
		'content-holder':function(data){
			if(!data.name) $(this).jTagError('content-holder: no name specified');
			$(this).wrap('<div id="content-holder-'+data.name+'"></div>');
			$(this).jend();
			
			//if user refreshes , the content will be loaded 
			if(urlParam('href'))
				ajaxBrowse(urlParam('href') , false);
			
			//those events should not be bound more than once by another `content-holder` jTag
			if(!window.bound){
				//if user presses back or forward , the content will be loaded 
				window.onpopstate = function(){
					if(urlParam('href'))
						ajaxBrowse(urlParam('href') , false);
					else $('[id^=content-holder-]').html('');
				};
				//if user clicks on a link , the content will be loaded 
				$('html').on('click' , 'a[href]:not([rel=external])' , function(ev){
					ev.preventDefault();
					ajaxBrowse($(this).attr('href'));
				});
				window.bound = true;
			}
		}
	};
	
	//utility that is used to replace text in without destroying the DOM
	$.fn.textCrawl = function(regex,callback){
		//native element
		var e = this.get(0);
		
		for(var i = 0 ; i < e.childNodes.length ; i++){
			var child = e.childNodes[i];
			
			//if element
			if(child.nodeType == 1){
				//iterate over attributes and match regex in attribute value
				for(var j = 0; j < child.attributes.length ; j++)
				{
					var res = matchandcall(child.attributes[j].value , regex , callback);
					if(res)
					child.attributes[j].value = res;
				}
				
				$(child).textCrawl(regex,callback);
			}
			//if text node
			else if(child.nodeType == 3){
				
				//match text node data
				var res = matchandcall(child.data , regex , callback);
				if(res)
				child.data = res;
			}
		}
		
		/* call a callback and provide it with the original string and an array of matched , 
		 * the callback should return a new string with replaced values*/
		function matchandcall(val , regex , callback)
		{
			var matches = [],match;
			while(match = regex.exec(val))
				matches.push(match);
			if(matches.length > 0)
				return callback.call(window,val,matches);
			else return false;
		}
	};
	
	/* utility , instead of reloading the page , $.get the page , look for <content> tags with [name]
	 * and push their content into the appropriate content holders (created by content-holder jTag)
	 * then update history accordingly*/
	window.ajaxBrowse = function(href , history){
		var e = this;
		$(window).trigger('beforeAjaxBrowse' , href);
		$.get(href , function(res){
			$(res).filter('content[name]').each(function(i,el){
				$('[id^=content-holder-'+$(el).attr('name')+']').html('').append($(el).contents().clone(true));
			});
			if(history !== false)
				window.history.pushState('', '', urlParam('href' , href));
			$(window).trigger('afterAjaxBrowse' , href);
		});
	};
	
	/* get\set query string parameters (...?paramName=paramvalue) , 
	 * when using set the function returns the new query sting but does not change location.href*/
	window.urlParam = function(key , value){
		
		var query = location.search;
		
		//helpers
		if(!window.doneHelpers){
			String.prototype.trimEnd = function(c) {
			    if (c)        
			        return this.replace(new RegExp(c.escapeRegExp() + "*$"), '');
			    return this.replace(/\s+$/, '');
			};
			String.prototype.trimStart = function(c) {
			    if (c)
			        return this.replace(new RegExp("^" + c.escapeRegExp() + "*"), '');
			    return this.replace(/^\s+/, '');
			};
	
			String.prototype.escapeRegExp = function() {
			    return this.replace(/[.*+?^${}()|[\]\/\\]/g, "\\$0");
			};
		}
		window.doneHelpers = true;
		
		if(value)
			return setUrlEncodedKey(key,value,query);
		else
			return getUrlEncodedKey(key,query);
		
		function getUrlEncodedKey(key, query) {
		    if (!query)
		        query = window.location.search;    
		    var re = new RegExp("[?|&]" + key + "=(.*?)&");
		    var matches = re.exec(query + "&");
		    if (!matches || matches.length < 2)
		        return "";
		    return decodeURIComponent(matches[1].replace("+", " "));
		}
		function setUrlEncodedKey(key, value, query) {
		   
		    query = query || window.location.search;
		    var q = query + "&";
		    var re = new RegExp("[?|&]" + key + "=.*?&");
		    if (!re.test(q))
		        q += key + "=" + encodeURI(value);
		    else
		        q = q.replace(re, "&" + key + "=" + encodeURIComponent(value) + "&");
		    q = q.trimStart("&").trimEnd("&");
		    return q[0]=="?" ? q : q = "?" + q;
		}
		
	};
	
}( jQuery ));
