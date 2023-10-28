(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[29],{

/***/ "zuu/":
/*!*******************************************************!*\
  !*** ./modules/SessionTimeoutWebclient/js/manager.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
			
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
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
		
		oSettings = oAppData['SessionTimeoutWebclient'] || {}
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


/***/ })

}]);