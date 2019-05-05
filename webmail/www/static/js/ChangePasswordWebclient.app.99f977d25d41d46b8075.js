webpackJsonp([3],{

/***/ 252:
/*!*******************************************************!*\
  !*** ./modules/ChangePasswordWebclient/js/manager.js ***!
  \*******************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = function (oAppData) {
		var App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ 182);
		
		if (App.getUserRole() === Enums.UserRole.NormalUser)
		{
			var Settings = __webpack_require__(/*! modules/ChangePasswordWebclient/js/Settings.js */ 253);

			Settings.init(oAppData);

			return {
				start: function (ModulesManager) {
					if (Settings.ShowSingleMailChangePasswordInCommonSettings)
					{
						ModulesManager.run(
							'SettingsWebclient',
							'registerSettingsTabSection', 
							[
								function () { return __webpack_require__(/*! modules/ChangePasswordWebclient/js/views/ChangeSingleMailAccountPasswordView.js */ 254); },
								'common',
								'common'
							]
						);
					}
				},
				getChangePasswordPopup: function () {
					return __webpack_require__(/*! modules/ChangePasswordWebclient/js/popups/ChangePasswordPopup.js */ 255);
				},
				isChangePasswordButtonAllowed: function (iAccountCount, oAccount) {
					return (!Settings.ShowSingleMailChangePasswordInCommonSettings || iAccountCount > 1) && !!oAccount.aExtend.AllowChangePasswordOnMailServer;
				}
			};
		}
		
		return null;
	};


/***/ }),

/***/ 253:
/*!********************************************************!*\
  !*** ./modules/ChangePasswordWebclient/js/Settings.js ***!
  \********************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		
		Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ 181)
	;

	module.exports = {
		// If true and there is only one mail account show change password button in common settings, not in mail account properties screen.
		ShowSingleMailChangePasswordInCommonSettings: false,
		
		/**
		 * Initializes settings from AppData object sections.
		 * 
		 * @param {Object} oAppData Object contained modules settings.
		 */
		init: function (oAppData)
		{
			var oAppDataSection = oAppData['ChangePasswordWebclient'];
			
			if (!_.isEmpty(oAppDataSection))
			{
				this.ShowSingleMailChangePasswordInCommonSettings = Types.pBool(oAppDataSection.ShowSingleMailChangePasswordInCommonSettings, this.ShowSingleMailChangePasswordInCommonSettings);
			}
		}
	};


/***/ }),

/***/ 254:
/*!*****************************************************************************************!*\
  !*** ./modules/ChangePasswordWebclient/js/views/ChangeSingleMailAccountPasswordView.js ***!
  \*****************************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		ko = __webpack_require__(/*! knockout */ 44),
		
		ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ 42),
		
		Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ 192),
		ChangePasswordPopup = ModulesManager.run('ChangePasswordWebclient', 'getChangePasswordPopup'),
		
		Settings = __webpack_require__(/*! modules/ChangePasswordWebclient/js/Settings.js */ 253)
	;

	/**
	 * @constructor
	 */
	function CChangeSingleMailAccountPasswordView()
	{
		this.oSingleMailAccount = null;
		this.showChangePasswordButton = ko.observable(false);
		this.init();
	}

	CChangeSingleMailAccountPasswordView.prototype.ViewTemplate = 'ChangePasswordWebclient_ChangeSingleMailAccountPasswordView';

	CChangeSingleMailAccountPasswordView.prototype.init = function ()
	{
		var
			oAccountList = ModulesManager.run('MailWebclient', 'getAccountList', []),
			fCheckAccountList = function () {
				if (oAccountList.collection().length === 1)
				{
					this.oSingleMailAccount = oAccountList.collection()[0];
					this.showChangePasswordButton(true);
				}
				else
				{
					this.oSingleMailAccount = null;
					this.showChangePasswordButton(false);
				}
			}.bind(this)
		;
		if (oAccountList && _.isFunction(oAccountList.collection))
		{
			fCheckAccountList();
			oAccountList.collection.subscribe(fCheckAccountList);
		}
	};

	CChangeSingleMailAccountPasswordView.prototype.changePassword = function ()
	{
		if (this.oSingleMailAccount)
		{
			Popups.showPopup(ChangePasswordPopup, [{
				iAccountId: this.oSingleMailAccount.id(),
				sModule: 'Mail',
				bHasOldPassword: true
			}]);
		}
	};

	module.exports = new CChangeSingleMailAccountPasswordView();


/***/ }),

/***/ 255:
/*!**************************************************************************!*\
  !*** ./modules/ChangePasswordWebclient/js/popups/ChangePasswordPopup.js ***!
  \**************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		$ = __webpack_require__(/*! jquery */ 1),
		ko = __webpack_require__(/*! knockout */ 44),
		
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
		UrlUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Url.js */ 179),
		ValidationUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Validation.js */ 256),
		
		Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ 191),
		Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ 186),
		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		
		CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ 194)
	;

	/**
	 * @constructor
	 */
	function CChangePasswordPopup()
	{
		CAbstractPopup.call(this);
		
		this.currentPassword = ko.observable('');
		this.newPassword = ko.observable('');
		this.confirmPassword = ko.observable('');
		
		this.accountId = ko.observable('');
		this.hasOldPassword = ko.observable(false);
		this.oParams = null;
	}

	_.extendOwn(CChangePasswordPopup.prototype, CAbstractPopup.prototype);

	CChangePasswordPopup.prototype.PopupTemplate = 'ChangePasswordWebclient_ChangePasswordPopup';

	/**
	 * @param {Object} oParams
	 * @param {String} oParams.sModule
	 * @param {boolean} oParams.bHasOldPassword
	 * @param {Function} oParams.fAfterPasswordChanged
	 */
	CChangePasswordPopup.prototype.onOpen = function (oParams)
	{
		this.currentPassword('');
		this.newPassword('');
		this.confirmPassword('');
		
		this.accountId(oParams.iAccountId);
		this.hasOldPassword(oParams.bHasOldPassword);
		this.oParams = oParams;
	};

	CChangePasswordPopup.prototype.change = function ()
	{
		var
			sNewPass = $.trim(this.newPassword()),
			sConfirmPassword = $.trim(this.confirmPassword())
		;
		
		if (ValidationUtils.checkPassword(sNewPass, sConfirmPassword))
		{
			this.sendChangeRequest();
		}
	};

	CChangePasswordPopup.prototype.sendChangeRequest = function ()
	{
		var
			oParameters = {
				'AccountId': this.accountId(),
				'CurrentPassword': $.trim(this.currentPassword()),
				'NewPassword': $.trim(this.newPassword())
			},
			oExcept = {
				Module: this.oParams.sModule,
				Method: 'ChangePassword'
			};
		;
		
		Ajax.send(this.oParams.sModule, 'ChangePassword', oParameters, this.onUpdatePasswordResponse, this);
		Ajax.abortAndStopSendRequests(oExcept);
	};

	/**
	 * @param {Object} oResponse
	 * @param {Object} oRequest
	 */
	CChangePasswordPopup.prototype.onUpdatePasswordResponse = function (oResponse, oRequest)
	{
		if (oResponse.Result === false)
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('CHANGEPASSWORDWEBCLIENT/ERROR_PASSWORD_NOT_SAVED'));
			Ajax.startSendRequests();
		}
		else
		{
			if (oResponse.Result && oResponse.Result.RefreshToken)
			{
				$.cookie('AuthToken', oResponse.Result.RefreshToken, { expires: 30 });
				UrlUtils.clearAndReloadLocation(true, false);
			}
			else
			{
				if (this.hasOldPassword())
				{
					Screens.showReport(TextUtils.i18n('CHANGEPASSWORDWEBCLIENT/REPORT_PASSWORD_CHANGED'));
				}
				else
				{
					Screens.showReport(TextUtils.i18n('CHANGEPASSWORDWEBCLIENT/REPORT_PASSWORD_SET'));
				}

				this.closePopup();

				if ($.isFunction(this.oParams.fAfterPasswordChanged))
				{
					this.oParams.fAfterPasswordChanged();
				}
			}
		}
	};

	module.exports = new CChangePasswordPopup();


/***/ }),

/***/ 256:
/*!******************************************************!*\
  !*** ./modules/CoreWebclient/js/utils/Validation.js ***!
  \******************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var
		_ = __webpack_require__(/*! underscore */ 2),
		
		Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ 188),
		
		ValidationUtils = {}
	;

	ValidationUtils.checkIfFieldsEmpty = function (aRequiredFields, sErrorText)
	{
		var koFirstEmptyField = _.find(aRequiredFields, function (koField) {
			return koField() === '';
		});
		
		if (koFirstEmptyField)
		{
			if (sErrorText)
			{
				Screens.showError(sErrorText);
			}
			koFirstEmptyField.focused(true);
			return false;
		}
		
		return true;
	};

	ValidationUtils.checkPassword = function (sNewPass, sConfirmPassword)
	{
		var
			TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ 185),
			Settings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ 43),
			bPasswordValid = false
		;
		
		if (sConfirmPassword !== sNewPass)
		{
			Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_PASSWORDS_DO_NOT_MATCH'));
		}
		else if (Settings.PasswordMinLength > 0 && sNewPass.length < Settings.PasswordMinLength) 
		{ 
			Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_PASSWORD_TOO_SHORT').replace('%N%', Settings.PasswordMinLength));
		}
		else if (Settings.PasswordMustBeComplex && (!sNewPass.match(/([0-9])/) || !sNewPass.match(/([!,%,&,@,#,$,^,*,?,_,~])/)))
		{
			Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_PASSWORD_TOO_SIMPLE'));
		}
		else
		{
			bPasswordValid = true;
		}
		
		return bPasswordValid;
	};

	module.exports = ValidationUtils;


/***/ })

});