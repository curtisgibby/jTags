J-Framework
===========

J Framework is a Javascript library implemented as a jQuery plugin that is ment to be the base framework for building web apps that minimize Server-Client communication as well as for a simple , dynamic , and flexible way to create web applications.

How It Works
============

J Framework consists of the J engine and the J Extensions.

extensions are tags that perform a certain task (like loading content , or repeating content for a certain number of times). extensions are contained in a javascript object ($.j.extensions) in the format of a tagname that is associated with a function. After the job of the extension is done , a function ($(this).jend()) is called to terminate the tag and to allow the tags inside of it to do their job.

example:
