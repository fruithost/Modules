'use strict';

var
	_ = require('underscore'),
	Enums = {}
;

/**
 * @enum {number}
 */
Enums.LoginSignMeType = {
	'DefaultOff': 0,
	'DefaultOn': 1,
	'Unuse': 2
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
