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
			$(this).jend('<div id="content-holder-'+data.name+'"></div>');
			
			//if user refreshes , the content will be loaded 
			if($.urlParam('href'))
				$.ajaxBrowse($.urlParam('href') , false);
			
			//those events should not be bound more than once by another `content-holder` jTag
			if(!window.bound){
				//if user presses back or forward , the content will be loaded 
				window.onpopstate = function(){
					if($.urlParam('href'))
						$.ajaxBrowse($.urlParam('href') , false);
					else $('[id^=content-holder-]').html('');
				};
				//if user clicks on a link , the content will be loaded 
				$('html').on('click' , 'a[href]:not([rel=external])' , function(ev){
					ev.preventDefault();
					$.ajaxBrowse($(this).attr('href'));
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
	$.ajaxBrowse = function(href , history){
		var e = this;
		$(window).trigger('beforeAjaxBrowse' , href);
		$.get(href , function(res){
			$(res).filter('content[name]').each(function(i,el){
				$('[id^=content-holder-'+$(el).attr('name')+']').html('').append($(el).contents().clone(true));
			});
			if(history !== false)
				window.history.pushState('', '', $.urlParam('href' , href));
			$(window).trigger('afterAjaxBrowse' , href);
		});
	};
	
	/* get\set query string parameters (...?paramName=paramvalue) , 
	 * when using set the function returns the new query sting but does not change location.href*/
	$.urlParam = function(key , value){
		
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
