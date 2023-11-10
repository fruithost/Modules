(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[12],{

/***/ "5xHl":
/*!********************************************************!*\
  !*** ./modules/RecaptchaWebclientPlugin/js/manager.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (oAppData) {
	var
		_ = __webpack_require__(/*! underscore */ "F/us"),
		
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
		
		Settings = __webpack_require__(/*! modules/RecaptchaWebclientPlugin/js/Settings.js */ "gAoQ")
	;

	Settings.init(oAppData);

	if (App.getUserRole() === Enums.UserRole.Anonymous)
	{
		return {
			start: function (ModulesManager)
			{
				if (Settings.ShowRecaptcha)
				{
					var CMainView = __webpack_require__(/*! modules/RecaptchaWebclientPlugin/js/views/CMainView.js */ "z3Sa");
					App.subscribeEvent('AnonymousUserForm::PopulateBeforeButtonsControllers', _.bind(function (oParams) {
						if (_.isFunction(oParams.RegisterBeforeButtonsController))
						{
							oParams.RegisterBeforeButtonsController(new CMainView(
								oParams.ModuleName,
								(oParams.ModuleName === 'StandardLoginFormWebclient' || oParams.ModuleName === 'MailLoginFormWebclient')
							));
						}
					}, this));
				}
			}
		};
	}
	return null;
};


/***/ }),

/***/ "gAoQ":
/*!*********************************************************!*\
  !*** ./modules/RecaptchaWebclientPlugin/js/Settings.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),

	Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV")
;

module.exports = {
	ModuleName: 'RecaptchaWebclientPlugin',
	PublicKey: '',
	LimitCount: 0,
	ShowRecaptcha: true,

	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ModuleName] || {};
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.PublicKey = Types.pString(oAppDataSection.PublicKey, this.PublicKey);
			this.LimitCount = Types.pInt(oAppDataSection.LimitCount, this.LimitCount);
			this.ShowRecaptcha = Types.pBool(oAppDataSection.ShowRecaptcha, this.ShowRecaptcha);
		}
	}
};


/***/ }),

/***/ "z3Sa":
/*!****************************************************************!*\
  !*** ./modules/RecaptchaWebclientPlugin/js/views/CMainView.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var
	_ = __webpack_require__(/*! underscore */ "F/us"),
	$ = __webpack_require__(/*! jquery */ "EVdn"),
	ko = __webpack_require__(/*! knockout */ "0h2I"),
	
	App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
	
	Settings = __webpack_require__(/*! modules/RecaptchaWebclientPlugin/js/Settings.js */ "gAoQ")
;

/**
 * @param {string} sModuleName
 * @param {boolean} bUseLimitCount
 * @constructor
 */
function CMainView(sModuleName, bUseLimitCount)
{
	this.sModuleName = sModuleName;
	this.bShown = false;
	this.recaptchaPlace = ko.observable(null);
	this.recaptchaPlace.subscribe(function () {
		this.ShowRecaptcha();
	}, this);
	this.iAuthErrorCount = ko.observable(0);
	this.bShowRecaptcha = ko.observable(true);

	if (bUseLimitCount)
	{
		this.iAuthErrorCount($.cookie('auth-error') || 0);
		this.iLimitCount = Settings ? Settings.LimitCount : 0;
		//If the user has exceeded the number of authentication attempts - recaptcha will be shown 
		if (this.iAuthErrorCount() < this.iLimitCount)
		{
			this.bShowRecaptcha(false);
		}
		App.subscribeEvent('ReceiveAjaxResponse::after', _.bind(function (oParams) {
			if ((oParams.Request.Module === 'StandardLoginFormWebclient' || oParams.Request.Module === 'MailLoginFormWebclient')
				&& oParams.Request.Method === 'Login'
				&& oParams.Response.Result === false)
			{
				//In case of unsuccessful authentication the counter of unsuccessful attempts will be updated.
				this.iAuthErrorCount($.cookie('auth-error') || 0);
				if (this.iAuthErrorCount() >= this.iLimitCount)
				{
					if (this.bShowRecaptcha())
					{
						window.grecaptcha.reset(this.widgetId);
					}
					else
					{
						this.bShowRecaptcha(true);
					}
				}
			}
		}, this));
	}
	
	App.subscribeEvent('AnonymousUserForm::PopulateFormSubmitParameters', _.bind(function (oParams) {
		if (oParams.Module === sModuleName && oParams.Parameters)
		{
			var aParams = this.getParametersForSubmit();
			_.extend(oParams.Parameters, aParams);
		}
	}, this));
	
	if (!window.grecaptcha)
	{
		window['ShowRecaptcha' + sModuleName] = this.ShowRecaptcha.bind(this);
		$.getScript('https://www.google.com/recaptcha/api.js?onload=ShowRecaptcha' + sModuleName + '&render=explicit');
	}
	else
	{
		this.ShowRecaptcha();
	}
}

CMainView.prototype.ViewTemplate = 'RecaptchaWebclientPlugin_MainView';

CMainView.prototype.ShowRecaptcha = function ()
{
	if (window.grecaptcha && this.recaptchaPlace())
	{
		if (!this.bShown)
		{
			var
				sKey = Settings ? Settings.PublicKey : ''
			;

			if (sKey === '')
			{
				sKey = "wrong-key";
			}
			this.recaptchaPlace().append('<div id="recaptcha-place-' + this.sModuleName + '"></div>');
			this.widgetId = window.grecaptcha.render('recaptcha-place-' + this.sModuleName, {
				'sitekey': sKey
			});
		}
		else
		{
			window.grecaptcha.reset(this.widgetId);
		}
		this.bShown = true;
	}
};

CMainView.prototype.getParametersForSubmit = function ()
{
	var
		sParamName = Settings.ModuleName + "Token",
		oResult = {}
	;

	oResult[sParamName] = window.grecaptcha.getResponse(this.widgetId);
	return oResult;
};

module.exports = CMainView;


/***/ })

}]);