---
layout: page
title: Examples
permalink: /examples/
---

###<span class="yellow">j</span>Tag Examples!


##example #1 (repeater): copy

write this in your html:

{% highlight ruby %}
    <repeater times="3">
        <p>this will be repeated 3 times</p>
    </repeater>
{% endhighlight %}

<p class="text-center">Results</p>
{% highlight ruby %}
<p>this will be repeated 3 times</p>

<p>this will be repeated 3 times</p>

<p>this will be repeated 3 times</p>
{% endhighlight %}

##example #2 (jtag): copy

write this in your html:

{% highlight ruby %}
    <jtag code="var html=$(this).html();
                $(this).html(html.replace(/blue/gi, 'red'));
                $(this).jend();"> 
        Mr Blue has a blue house and a blue car 
    </jtag>
{% endhighlight %}

<p class="text-center">Results</p>
{% highlight ruby %}
Mr red has a red house and a red car 
{% endhighlight %}

##example #3 (fragments): copy

write this in your html:

{% highlight ruby %}
    <define-fragment name="post">
        <div class="post">
            User: "{{ {%username [annoymous]"}}%}<br />
            <p>
                {{"{%text [no text available] "}}%}
            </p>
        </div>
    </define-fragment>

    <fragment name="post" username="John Connor" text="I've just invented Skynet !"></fragment>
{% endhighlight %}

<p class="text-center">Results</p>
{% highlight ruby %}
 <div class="post">
        User: John Connor<br>
        <p>
            I've just invented Skynet !
        </p>
</div>
{% endhighlight %}
