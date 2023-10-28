'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
			
	aSessionTimeoutFunctions = [],
	iSessionTimeout = 0,
	iTimeoutMinutes = 0
;

function LogoutBySessionTimeout()
{
	_.each(aSessionTimeoutFunctions, function (oFunc) {
		oFunc();
	});

	_.delay(function () {
		App.logout();
	}, 500);
}

function SetSessionTimeout()
{
	clearTimeout(iSessionTimeout);
	iSessionTimeout = setTimeout(LogoutBySessionTimeout, iTimeoutMinutes * 60 * 1000);
}

module.exports = function (oAppData) {
	var
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		oSettings = oAppData['%ModuleName%'] || {}
	;

	if (App.getUserRole() !== Enums.UserRole.Anonymous && typeof oSettings.TimeoutMinutes === 'number' && oSettings.TimeoutMinutes > 0)
	{
		iTimeoutMinutes = oSettings.TimeoutMinutes;

		SetSessionTimeout();

		$('body')
			.on('click', SetSessionTimeout)
			.on('keydown', SetSessionTimeout)
		;
	}

	if (App.isUserNormalOrTenant())
	{
		return {
			registerFunction: function (oSessionTimeoutFunction) {
				aSessionTimeoutFunctions.push(oSessionTimeoutFunction);
			}
		};
	}
	
	return null;
};
