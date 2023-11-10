'use strict';

var
	_ = require('underscore'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	Enums = {}
;

Enums.LogLevel = Settings.ELogLevel;

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
