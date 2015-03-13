/*! HelpSmith Web Help System 2.0
* http://www.helpsmith.com
* Copyright (c) 2007-2013 Divcom Software */
$(document).ready(function(){$.browser.opera&&$("frameset[framespacing]").removeAttr("framespacing");var b=$("frame[name=topic]"),a=getTopicFromQuery(b.attr("src"));if(!1===a)a="unknown.htm";else{var c=getQueryAnchor();""!=c&&(a+="#"+c)}b.attr("src",a)});