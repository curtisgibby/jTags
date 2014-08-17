J-Framework
===========

J Framework is a Javascript library implemented as a jQuery plugin that is ment to be the base framework for building web apps that minimize Server-Client communication as well as for a simple , dynamic , and flexible way to create web 
applications.

install it on your site
=======================

1. download the zip
2. unzip the files
3. include jQuery `<script src="path/to/jQuery.min.js"></script>`
4. include J Framework `<script src="path/to/j.min.js"></script>`
5. have fun !
(make sure you include jQuery before J Framework)

How It Works
============

J Framework consists of the J engine and the J Extensions.

extensions are tags that perform a certain task (like loading content , or repeating content for a certain number of times). extensions are contained in a javascript object (`$.j.extensions`) in the format of a tagname that is associated with a function. After the job of the extension is done , a function (`$(this).jend()`) is called to terminate the tag and to allow the tags inside of it to do their job.

example:
---------
#####this:
```html
<repeater times="5">
	<div>this will be repeated 5 times</div>
</repeater>
```
#####will turn into this:
```html
<div>this will be repeated 5 times</div>
<div>this will be repeated 5 times</div>
<div>this will be repeated 5 times</div>
<div>this will be repeated 5 times</div>
<div>this will be repeated 5 times</div>
```
#####the code for the extension:
```javascript
$.j.extensions.repeater = function(){
	var html = $(this).html();//store the content in a varible
	$(this).html('');//delete the content iside the tag
	for(var i = 0 ; i < $(this).attr('times') ; i++) //append the content [times] times to the tag
		$(this).append(html);
	
	$(this).jend(); // *most importantly* terminate the extension
};
```
under the hood:
---------------

J engine iterates from the outer most extension tags , working it's way down , calling the function related to the tag ,  until no extension tags are left. the J engine looks for the `skip` attribute , which is used to tell the engine whether or not to skip this tag and all its children extension tags in execution. if the `skip` attribute is set to a `number` the engine skips the tag the number of times indicated in the attribute. if the `skip` attribute is set to `1` or `once` it will skip and remove the `skip` attribute. if the `skip` attrbibute is set to `true` or `any other value` , it will skip it *forever* and the tag will not terminate until `.jend()` has been called upon it.

This feature makes it possible for you to create extension that work in an asynchronos manner by setting `skip = true` and terminating only when the task is truly done.

GPL License
===========

####GPL (GNU General Public License) : basicaly it means you can do whatever you want with this code. have fun modifying ! 
