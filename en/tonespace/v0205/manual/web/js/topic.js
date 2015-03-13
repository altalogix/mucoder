/*! HelpSmith Web Help System 2.0
* http://www.helpsmith.com
* Copyright (c) 2007-2013 Divcom Software */
$(document).ready(function(){highlightSearchWords()});function syncToc(a,b){0==top.frames.length?"0"!==getParamValue("frames",get_getQuery())&&(window.location="../"+b+"?context="+a):top.navi.setCurrentTopic?top.navi.setCurrentTopic(a):$(top.document).find("frame[name=navi]").load(function(){top.navi.setCurrentTopic(a)})};