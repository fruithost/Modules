webpackJsonp([19],{

/***/ 404:
/*!*******************************************************!*\
  !*** ./modules/SessionTimeoutWebclient/js/manager.js ***!
  \*******************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		$ = __webpack_require__(/*! jquery */ 1),
		
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182),
				
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
			App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182),
			
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

		if (App.getUserRole() === Enums.UserRole.NormalUser)
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

});