(function ( $ ) {
	
	$.fn.textWalk = function (pattern, callback) {
		var matches= [];
	    for (var childi= this.get(0).childNodes.length; childi-->0;) {
	        var child= this.get(0).childNodes[childi];
	        if (child.nodeType==1) {
	            var tag= child.tagName.toLowerCase();
	            if (tag!=='script' && tag!=='style' && tag!=='textarea')
	            {
	                $(child).textWalk(pattern, callback);
	            }
	        } else if (child.nodeType==3) {
	            
	            if (typeof pattern==='string') {
	                var ix= 0;
	                while (true) {
	                    ix= child.data.indexOf(pattern, ix);
	                    if (ix===-1)
	                        break;
	                    matches.push({index: ix, '0': pattern});
	                }
	            } else {
	                var match;
	                while (match= pattern.exec(child.data))
	                    matches.push(match);
	            }
	            for (var i= matches.length; i-->0;)
	                callback.call(window, child, matches[i]);
	        }
	    }
	};
	
	$(window).load(function(){$.j();});
	
	$.j = function ()
	{
		if($.j.status == true) return;
		$.j.status = true;
		var pre = '';
    	var post = 'a';
    	var ext = $.j.extensions;
    	debugger;
    	while(pre !== post)
    	{
    		pre = $('html').html();
    		
    		var str = '';
    		
    		for (var key in ext) {
    		  if (ext.hasOwnProperty(key)) {
    			  str+=key+',';
    		  }
    		}
    		
    		str = str.substr(0,str.length-1);
    		
    		$(str).each(function(i,e)
    		{
    			if($(e).parents(str).length == 0 && typeof $(e).attr('skip') === 'undefined' )
    			{
    				ext[$(e).prop('tagName').toLowerCase()].call(e);
    				if(typeof $(e).attr('skip') === 'undefined')
    					$(e).attr('skip' , 'true');
    			}
    			if(typeof $(e).attr('skip') !== 'undefined')
    			{
    				if(!isNaN($(e).attr('skip')) && $(e).attr('skip') > 1 ) $(e).attr('skip' ,$(e).attr('skip') -1);
    				else if($(e).attr('skip') == 1) $(e).attr('skip' , 'once');
    				else if($(e).attr('skip') == 'once') $(e).removeAttr('skip');
    			}
    		});
    		
    		post = $('html').html();
    	}
    	$.j.status = false;
	};
	
	$.fn.jend = function(content)
	{
		if(typeof content !== 'undefined')
			$(this).replaceWith(content);
		else
			$(this).replaceWith($(this).contents());
		$.j();
	};
	
	$.j.extensions = 
	{
		'extension':function()
		{
			var e = this;
		
			if(!$(e).is('[name]')) return;
			var name = $(e).attr('name');
			var f = null;
			if($(e).is('[source]'))
			{
				f = $(e).html();
				add();
			}
			else
			{
				$.get($(e).attr('source'),function(res){
					f = res;
					add();
				});
			}
			$(e).jend();
			function add()
			{
				try
				{
					f = eval('['+f+']')[0];
				}catch(v)
				{
					return;
				}
				
				$.j.extensions[name] = f;
				
				$(e).jend();
			}
		},
	
		'j':function()
		{
			try{eval($(this).attr('code'));}catch(e){$(this).jend();}
		},
		
		'load':function()
		{
			var e = this;
			if($(e).is('[action]'))
			$(e).load($(e).attr('action') , function(responseText, textStatus, jqXHR){
				if(textStatus == 'success')
				$(e).jend();
			});
		},
		
		'define-fragment':function()
    	{
			$(this).hide();
			if(!$(this).is('[name]')) {$(this).jend();return;}
    		var e = this;
    		var val = '';
    		
    		if(!$.j.fragments)
    			$.j.fragments = {};
    		
    		if($(e).is('[source]'))
			{
    			$(e).load($(e).attr('source') , function(responseText, textStatus, jqXHR){
    				if(textStatus == 'success')
    				end();
    			});
			}
    		else
				end();
    		
    		function end()
    		{
    			val = $(e).contents().clone(true);
				$.j.fragments[$(e).attr('name')] = val;
    			$(e).jend('');
    		}
    	},
    	
    	'fragment':function()
    	{
			if(!$(this).is('[name]') || !$.j.fragments) {$(this).jend();return;}
			if(!$.j.fragments[$(this).attr('name')]) {$(this).attr('skip' , 'once'); return; };
    		var e = this;
    		
    		if($(e).is('[source]'))
    		{
    			$.getJSON($(e).attr('source') , function(res){
    				$(e).data('fragment-data' , $.extend($(e).data('fragment-data') , res));
    				fillParams();
    			}).error(function(){fillParams();});
    		}else
    			fillParams();
    		
    		function fillParams()
    		{
    			$(e).html('');
    			$(e).append($.j.fragments[$(e).attr('name')].clone(true));
    			
    			var paramPatt = /{%(\w+) *(\[(?:.|\r|\n)*?\])? *%}/gm;
    			
    			$(e).textWalk(paramPatt , function(child , match){
    				var val = 'error: no value could be found for parameter: `' + match[1] + '`';
        			if(match[2])
        				val = match[2].substr(1,match[2].length-2);
        			if($(e).is('['+match[1]+']'))
        				val = $(e).attr(match[1]);
        			if($(e).data('fragment-data') && $(e).data('fragment-data')[match[1]])
        				val = $(e).data('fragment-data')[match[1]];
        			child.data = child.data.replace(match[0] , val);
    			});
    			
        		$(e).jend();
    		}
    	},
    	
    	'repeater':function()
    	{
    		e = this;
    		
    		if($(e).is('[source]'))
    		{
    			$.getJSON($(e).attr('source') , function(res){
    				debugger;
    				$(e).data('repeater-data' , $.extend($(e).data('repeater-data') , res));
    				hookData();
    			}).error(function(){
    				debugger;
    				hookData();
				});
    		}else
    			hookData();
    		
    		function hookData()
    		{
    			var data = $(e).data('repeater-data');
    			if(data)
    			var length = data.length;
    			if($(e).is('[times]') && !isNaN($(e).is('[times]')))
    				length = $(e).attr('times');
    			
    			var c = $(e).contents();
    			$(e).html('');
    			for(var i = 0 ; i < length ; i++)
    			{
    				var v = c.clone(true);
    				$(v).filter('fragment').each(function(x,elem){
    					if(data && data[i])
    					$(elem).data('fragment-data' , $.extend($(e).data('fragment-data') , data[i]));
    				});
    				$(e).append(v);
    			}
    			
    			$(e).jend();
    		}
    	}
    	
	};

	$.j.status = '';
	
}( jQuery ));;

