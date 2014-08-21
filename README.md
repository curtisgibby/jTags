About jTags
===========

jTags are a unique way of building a highly dynamic, customizable and efficient website quickly and easily. With jTags you can embed functionality to the markup tags to make them perform a certain task.


######example:
```html
<repeater times="3">
	<p>this will be repeated 3 times.</p>
<repeater>
```
######turns into this:
```html
<p>this will be repeated 3 times.</p>
<p>this will be repeated 3 times.</p>
<p>this will be repeated 3 times.</p>
```

standard jTags
--------------

The standard jTags are the jTags that come pre-built with the core library. they are ment to provide an easy way to create a web application that runs mostly on the client instead of the server thus making the website much more efficient , faster and much more dynamic. 

#####the problem:
server nowadays provide alot of redundant and identical data instead of efficiently providing only the data that is needed. this is because the web was designed for static html pages and not modern dynamic web applicaions.

thus every time you open facebook page , the server has to provide the html for the top navigation bar.
whenever you open the news feed identical html layout for every post needs to be provided with only a few variations in the content of the post.

this causes the server to spend alot of time providing redundant data instead of actual fresh data that the user wants.

because of that problem , the standard jTags are built with the moto :
***"the server is ment to provide data not junk !"***

with junk referring to the repetitive behaviour of servers nowadays.
the server sould *not* provide identical information twice , and should provide the data only when necessary.

#####the standard jTags:
* `extension` - quickly define a new jTag hard-coded or from ajax-call.
* `j` - perform arbitrary task with `code` attribute.
* `load` - load content via ajax call.
* `efine-fragment` - define a pattern with varibales to be used later.
* `fragment` - display the defined pattern and fill in the variables with data hard-coded or from ajax-call.
* `repeater` - repeat the content using an array of data hard-coded or from ajax-call.
* `content-holder` - makes the website operate in ajax-browsing , links will cause the page to be loaded via ajax to the content-holder

