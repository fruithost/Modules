webpackJsonp([23],{

/***/ 416:
/*!*********************************************!*\
  !*** ./modules/TwoFactorAuth/js/manager.js ***!
  \*********************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),

		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182),
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		Settings = __webpack_require__(/*! modules/TwoFactorAuth/js/Settings.js */ 417)
	;

	module.exports = function (oAppData) {
		Settings.init(oAppData);

		return {
			/**
			 * Runs before application start. Subscribes to the event before post displaying.
			 * 
			 * @param {Object} ModulesManager
			 */
			start: function (ModulesManager) {
				ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
					function () { return __webpack_require__(/*! modules/TwoFactorAuth/js/views/TwoFactorAuthSettingsFormView.js */ 418); },
					Settings.HashModuleName,
					TextUtils.i18n('TWOFACTORAUTH/LABEL_SETTINGS_TAB')
				]);
				App.subscribeEvent('StandardLoginFormWebclient::ConstructView::after', function (oParams) {
					var
						oLoginScreenView = oParams.View,
						Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ 192),
						VerifyTokenPopup = __webpack_require__(/*! modules/TwoFactorAuth/js/popups/VerifyTokenPopup.js */ 420)
					;

					if (oLoginScreenView)
					{
						oLoginScreenView.onSystemLoginResponse = function (oResponse, oRequest) {
							//if TwoFactorAuth enabled - trying to verify user token
							if (oResponse.Result && oResponse.Result.TwoFactorAuth && oResponse.Result.TwoFactorAuth.UserId)
							{
								Popups.showPopup(VerifyTokenPopup, [
									_.bind(this.onSystemLoginResponseBase, this),
									_.bind(function () { this.loading(false); }, this),
									oResponse.Result.TwoFactorAuth.UserId
								]);
							}
							else
							{
								this.onSystemLoginResponseBase(oResponse, oRequest);
							}
						};
					}
				});
			}
		};
	};


/***/ }),

/***/ 417:
/*!**********************************************!*\
  !*** ./modules/TwoFactorAuth/js/Settings.js ***!
  \**********************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		ko = __webpack_require__(/*! knockout */ 44),
		_ = __webpack_require__(/*! underscore */ 2),

		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181)
	;

	module.exports = {
		ServerModuleName: 'TwoFactorAuth',
		HashModuleName: 'two-factor-auth',
		EnableTwoFactorAuth: ko.observable(true),

		/**
		 * Initializes settings from AppData object sections.
		 * 
		 * @param {Object} oAppData Object contained modules settings.
		 */
		init: function (oAppData)
		{
			var oAppDataSection = _.extend({}, oAppData[this.ServerModuleName] || {}, oAppData['TwoFactorAuth'] || {});

			if (!_.isEmpty(oAppDataSection))
			{
				this.EnableTwoFactorAuth(Types.pBool(oAppDataSection.EnableTwoFactorAuth, this.EnableTwoFactorAuth()));
			}
		}
	};


/***/ }),

/***/ 418:
/*!*************************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/views/TwoFactorAuthSettingsFormView.js ***!
  \*************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		ko = __webpack_require__(/*! knockout */ 44),

		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ 42),
		CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
		Settings = __webpack_require__(/*! modules/TwoFactorAuth/js/Settings.js */ 417),
		Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ 192),
		ConfirmPasswordPopup = __webpack_require__(/*! modules/TwoFactorAuth/js/popups/ConfirmPasswordPopup.js */ 419),
		Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ 191)
	;

	/**
	 * @constructor
	 */
	function CTwoFactorAuthSettingsFormView()
	{
		CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

		this.isEnabledTwoFactorAuth = ko.observable(Settings.EnableTwoFactorAuth());
		this.isPasswordVerified = ko.observable(false);
		this.isShowSecret = ko.observable(false);
		this.isValidatingPin = ko.observable(false);
		this.QRCodeSrc = ko.observable('');
		this.secret = ko.observable('');
		this.pin = ko.observable('');
	}

	_.extendOwn(CTwoFactorAuthSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

	CTwoFactorAuthSettingsFormView.prototype.ViewTemplate = 'TwoFactorAuth_TwoFactorAuthSettingsFormView';

	CTwoFactorAuthSettingsFormView.prototype.confirmePassword = function ()
	{
		Popups.showPopup(ConfirmPasswordPopup, [
			_.bind(this.onConfirmePassword, this),
			'EnableTwoFactorAuth'
		]);
	};

	CTwoFactorAuthSettingsFormView.prototype.onConfirmePassword = function (Response)
	{
		if(Response && Response.Result && Response.Result.Secret && Response.Result.QRcode)
		{
			this.QRCodeSrc(Response.Result.QRcode);
			this.secret(Response.Result.Secret);
			this.isShowSecret(true);
		}
	};

	CTwoFactorAuthSettingsFormView.prototype.validatePin= function ()
	{
		this.isValidatingPin(true);
		Ajax.send(
			'TwoFactorAuth',
			'TwoFactorAuthSave', 
			{
				'Pin': this.pin(),
				'Secret': this.secret()
			},
			this.onValidatingPinResponse,
			this
		);
	};

	CTwoFactorAuthSettingsFormView.prototype.onValidatingPinResponse = function (Response)
	{
		this.isValidatingPin(false);
		if(Response && Response.Result)
		{
			this.QRCodeSrc('');
			this.secret('');
			this.pin('');
			this.isShowSecret(false);
			this.isEnabledTwoFactorAuth(true);
		}
		else
		{
			Screens.showError(TextUtils.i18n('TWOFACTORAUTH/ERROR_WRONG_PIN'));
		}
	};

	CTwoFactorAuthSettingsFormView.prototype.disable = function ()
	{
		Popups.showPopup(ConfirmPasswordPopup, [
			_.bind(function () {
				this.QRCodeSrc('');
				this.secret('');
				this.pin('');
				this.isShowSecret(false);
				this.isEnabledTwoFactorAuth(false);
			}, this),
			'DisableTwoFactorAuth'
		]);
	};

	module.exports = new CTwoFactorAuthSettingsFormView();


/***/ }),

/***/ 419:
/*!*****************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/popups/ConfirmPasswordPopup.js ***!
  \*****************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		ko = __webpack_require__(/*! knockout */ 44),

		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ 194),
		Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ 191)
	;

	/**
	 * @constructor
	 */
	function CConfirmPasswordPopup()
	{
		CAbstractPopup.call(this);

		this.onConfirm = null;
		this.password = ko.observable('');
		this.inPropgress = ko.observable(false);
		this.action = '';
	}

	_.extendOwn(CConfirmPasswordPopup.prototype, CAbstractPopup.prototype);

	CConfirmPasswordPopup.prototype.PopupTemplate = 'TwoFactorAuth_ConfirmPasswordPopup';

	CConfirmPasswordPopup.prototype.onOpen = function (onConfirm, sAction)
	{
		this.onConfirm = onConfirm;
		this.action = sAction;
	};

	CConfirmPasswordPopup.prototype.verifyPassword = function ()
	{
		this.inPropgress(true);
		Ajax.send(
			'TwoFactorAuth',
			this.action, 
			{
				'Password': this.password()
			},
			this.onGetVerifyResponse,
			this
		);
	};

	CConfirmPasswordPopup.prototype.onGetVerifyResponse = function (oResponse)
	{
		var oResult = oResponse.Result;

		if (oResult)
		{
			if (_.isFunction(this.onConfirm))
			{
				this.onConfirm(oResponse);
			}
			this.closePopup();
			this.password('');
		}
		else
		{
			Screens.showError(TextUtils.i18n('TWOFACTORAUTH/ERROR_WRONG_PASSWORD'));
		}
		this.inPropgress(false);
	};

	module.exports = new CConfirmPasswordPopup();


/***/ }),

/***/ 420:
/*!*************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/popups/VerifyTokenPopup.js ***!
  \*************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		ko = __webpack_require__(/*! knockout */ 44),

		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ 194),
		Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ 191),
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182);
	;

	/**
	 * @constructor
	 */
	function CVerifyTokenPopup()
	{
		CAbstractPopup.call(this);
		
		this.onConfirm = null;
		this.onCancel = null;
		this.pin = ko.observable('');
		this.inPropgress = ko.observable(false);
		this.UserId = null;
		this.pinFocused = ko.observable(false);
		this.isMobile = ko.observable(App.isMobile() || false);
	}

	_.extendOwn(CVerifyTokenPopup.prototype, CAbstractPopup.prototype);

	CVerifyTokenPopup.prototype.PopupTemplate = 'TwoFactorAuth_VerifyTokenPopup';

	CVerifyTokenPopup.prototype.onOpen = function (onConfirm, onCancel, UserId)
	{
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
		this.UserId = UserId;
		this.pinFocused(true);
	};

	CVerifyTokenPopup.prototype.verifyPin = function ()
	{
		this.inPropgress(true);
		Ajax.send(
			'TwoFactorAuth',
			'VerifyPin', 
			{
				'Pin': this.pin(),
				'UserId': this.UserId
			},
			this.onGetVerifyResponse,
			this
		);
	};

	CVerifyTokenPopup.prototype.onGetVerifyResponse = function (oResponse)
	{
		var oResult = oResponse.Result;

		if (oResult)
		{
			if (_.isFunction(this.onConfirm))
			{
				this.onConfirm(oResponse);
			}
			this.closePopup();
			this.pin('');
		}
		else
		{
			Screens.showError(TextUtils.i18n('TWOFACTORAUTH/ERROR_WRONG_PIN'));
			this.pin('');
		}
		this.inPropgress(false);
	};

	CVerifyTokenPopup.prototype.cancelPopup = function ()
	{
		if (_.isFunction(this.onCancel))
		{
			this.onCancel(false);
		}
		this.closePopup();
	};

	module.exports = new CVerifyTokenPopup();


/***/ })

});