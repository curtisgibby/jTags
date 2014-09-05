---
layout: page
title: Write jTag
permalink: /write-jTag/
---

###How to write a jTag ?

Writing a jTag is as easy as cake !  A jTag is only a key-value pair stored inside the **window.jTags** object. 
the key is the name of your jTag and the value is your jTag’s function.

example:
{% highlight ruby %}
    jTags["jtagname"] = function(data){
    //your code here
    var html = $(this).html();
    $(this).html(html.replace('US' , 'United States of America'));
    $(this).jend();
};
{% endhighlight %}

###Just a few remarks:

- The jTag name must be lower-case.
- The data object passed to the function contains the element’s attributes merged with it’s ```$.data('jTagData')``` (attributes override jTagData).
- Always call ```$(this).jend``` when your task is done to terminate your jTag [(wiki)](https://github.com/matantsu/jTags/wiki/jend "jTag WIKI").
- You can use ```$(this).skip('once')``` to tell the engine to skip the execution one time [(wiki)](https://github.com/matantsu/jTags/wiki/jend "jTag WIKI").
- The function is called in the context of the element. ```(this = element)```
That’s it !

###Result:

Whenever you write your jTag , the function will be called.

example:
{% highlight ruby %}
<jtagname>
    The US (USA or U.S.A.), commonly referred to as the US (US or U.S.), America, and sometimes the States
</jtagname>
{% endhighlight %}

turns into: 
{% highlight ruby %}
<jtagname>
    The United States of America (USA or U.S.A.), commonly referred to as the United States of America (United States of America or U.S.), America, and sometimes the States
</jtagname>
{% endhighlight %}
<br/>