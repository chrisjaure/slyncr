slyncr
======

Slyncr is a bookmarklet that will listen for commands from a remote website, primarily intended for controlling slides from a mobile phone.

Right now, the supported sites are 280slides.com and Scribd.com's html mode.

When my server's up, the controller url is http://cleverchris.com:8000/controller.html?[id]

For now, the 280slides id is "280slides+[user]+[name]" and the scribd id is "scribd+[id]". For example, the controller url for http://www.scribd.com/doc/41224012/No-SQL would be http://cleverchris.com:8000/controller.html?scribd+41224012

I will at some point implement some sort of url generator/shortener.
