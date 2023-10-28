(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[6],{

/***/ "2h1X":
/*!********************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/popups/VerifySecondFactorPopup.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(/*! underscore */ "F/us"),
    ko = __webpack_require__(/*! knockout */ "0h2I"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
    Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
    Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
    App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
    CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF"),
    Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
    ConvertUtils = __webpack_require__(/*! modules/TwoFactorAuth/js/utils/Convert.js */ "svu5"),
    DeviceUtils = __webpack_require__(/*! modules/TwoFactorAuth/js/utils/Device.js */ "XIpS"),
    Settings = __webpack_require__(/*! modules/TwoFactorAuth/js/Settings.js */ "7Lti");
/**
 * @constructor
 */


function CVerifySecondFactorPopup() {
  CAbstractPopup.call(this);
  this.isMobile = ko.observable(App.isMobile() || false);
  this.fAfterVerify = null;
  this.fOnCancel = null;
  this.login = ko.observable(null);
  this.sPassword = null;
  this.bAllowTrustedDevices = Settings.AllowTrustedDevices;
  this.verificationResponse = ko.observable(null);
  this.verificationPassed = ko.computed(function () {
    return this.verificationResponse() !== null;
  }, this);
  this.verificationResponse.subscribe(function () {
    if (this.verificationPassed() && !this.bAllowTrustedDevices) {
      this.afterVerify();
      this.closePopup();
    }
  }, this);
  this.trustThisBrowser = ko.observable(false);
  this.sTrustThisBrowserText = TextUtils.i18n('TWOFACTORAUTH/LABEL_TRUST_DEVICE_PLURAL', {
    'COUNT': Settings.TrustDevicesForDays
  }, null, Settings.TrustDevicesForDays);
  this.allOptionsVisible = ko.observable(false);
  this.securityKeyVisible = ko.observable(false);
  this.authenticatorAppVisible = ko.observable(false);
  this.backupCodesVisible = ko.observable(false);
  this.hasSecurityKey = ko.observable(false);
  this.securityKeyInProgress = ko.observable(false);
  this.securityKeyError = ko.observable(false);
  this.bSecurityKeysNotSupportedError = !(navigator.credentials && navigator.credentials.get);
  this.bIsHttps = window.location.protocol === 'https:';
  this.hasAuthenticatorApp = ko.observable(false);
  this.authenticatorCode = ko.observable('');
  this.authenticatorCodeFocused = ko.observable(false);
  this.authenticatorCodeInProgress = ko.observable(false);
  this.hasBackupCodes = ko.observable(false);
  this.backupCode = ko.observable(false);
  this.backupCodeFocus = ko.observable(false);
  this.backupCodeInProgress = ko.observable(false);
  this.hasSeveralOptions = ko.computed(function () {
    var iOptionsCount = 0;

    if (this.hasSecurityKey()) {
      iOptionsCount++;
    }

    if (this.hasAuthenticatorApp()) {
      iOptionsCount++;
    }

    if (this.hasBackupCodes()) {
      iOptionsCount++;
    }

    return iOptionsCount > 1;
  }, this);
  this.continueInProgress = ko.observable(false);
  this.continueCommand = Utils.createCommand(this, this.afterVerify, function () {
    return !this.continueInProgress();
  });
}

_.extendOwn(CVerifySecondFactorPopup.prototype, CAbstractPopup.prototype);

CVerifySecondFactorPopup.prototype.PopupTemplate = 'TwoFactorAuth_VerifySecondFactorPopup';

CVerifySecondFactorPopup.prototype.onOpen = function (fAfterVerify, fOnCancel, oTwoFactorAuthData, sLogin, sPassword) {
  this.continueInProgress(false);
  this.fAfterVerify = fAfterVerify;
  this.fOnCancel = fOnCancel;
  this.login(sLogin);
  this.sPassword = sPassword;
  this.hasSecurityKey(Settings.AllowSecurityKeys && oTwoFactorAuthData.HasSecurityKey);
  this.hasAuthenticatorApp(Settings.AllowAuthenticatorApp && oTwoFactorAuthData.HasAuthenticatorApp);
  this.hasBackupCodes(Settings.AllowBackupCodes && oTwoFactorAuthData.HasBackupCodes);
  this.verificationResponse(null);
  this.authenticatorCode('');
  this.authenticatorCodeInProgress(false);
  this.backupCode('');
  this.backupCodeInProgress(false);
  this.allOptionsVisible(false);
  this.securityKeyVisible(false);
  this.authenticatorAppVisible(false);
  this.backupCodesVisible(false);

  if (this.hasSecurityKey()) {
    this.useSecurityKey();
  } else if (this.hasAuthenticatorApp()) {
    this.useAuthenticatorApp();
  }
};

CVerifySecondFactorPopup.prototype.useOtherOption = function () {
  this.allOptionsVisible(true);
  this.securityKeyVisible(false);
  this.authenticatorAppVisible(false);
  this.backupCodesVisible(false);
};

CVerifySecondFactorPopup.prototype.useSecurityKey = function () {
  if (this.hasSecurityKey()) {
    this.allOptionsVisible(false);
    this.securityKeyVisible(true);
    this.authenticatorAppVisible(false);
    this.backupCodesVisible(false);
    this.verifySecurityKey();
  }
};

CVerifySecondFactorPopup.prototype.useAuthenticatorApp = function () {
  if (this.hasAuthenticatorApp()) {
    this.allOptionsVisible(false);
    this.securityKeyVisible(false);
    this.authenticatorAppVisible(true);
    this.backupCodesVisible(false);
    this.authenticatorCodeFocused(true);
  }
};

CVerifySecondFactorPopup.prototype.useBackupCodes = function () {
  if (this.hasBackupCodes()) {
    this.allOptionsVisible(false);
    this.securityKeyVisible(false);
    this.authenticatorAppVisible(false);
    this.backupCodesVisible(true);
    this.backupCodeFocus(true);
  }
};

CVerifySecondFactorPopup.prototype.verifySecurityKey = function () {
  if (!this.bSecurityKeysNotSupportedError) {
    var oParameters = {
      'Login': this.login(),
      'Password': this.sPassword
    };
    this.securityKeyInProgress(true);
    this.securityKeyError(false);
    Ajax.send('TwoFactorAuth', 'VerifySecurityKeyBegin', oParameters, this.onVerifySecurityKeyBegin, this);
  } else {
    this.securityKeyInProgress(false);
    this.securityKeyError(true);
  }
};

CVerifySecondFactorPopup.prototype.onVerifySecurityKeyBegin = function (oResponse) {
  var _this = this;

  var oGetArgs = oResponse && oResponse.Result;

  if (oGetArgs) {
    oGetArgs.publicKey.challenge = ConvertUtils.base64ToArrayBuffer(oGetArgs.publicKey.challenge);
    oGetArgs.publicKey.allowCredentials.forEach(function (element) {
      element.id = ConvertUtils.base64ToArrayBuffer(element.id);
    });
    navigator.credentials.get(oGetArgs).then(function (oCreds) {
      var oCredsResponse = oCreds && oCreds.response,
          oParameters = {
        'Login': _this.login(),
        'Password': _this.sPassword,
        'Attestation': {
          id: oCreds && oCreds.rawId ? ConvertUtils.arrayBufferToBase64(oCreds.rawId) : null,
          clientDataJSON: oCredsResponse && oCredsResponse.clientDataJSON ? ConvertUtils.arrayBufferToBase64(oCredsResponse.clientDataJSON) : null,
          authenticatorData: oCredsResponse && oCredsResponse.authenticatorData ? ConvertUtils.arrayBufferToBase64(oCredsResponse.authenticatorData) : null,
          signature: oCredsResponse && oCredsResponse.signature ? ConvertUtils.arrayBufferToBase64(oCredsResponse.signature) : null
        }
      };
      Ajax.send('TwoFactorAuth', 'VerifySecurityKeyFinish', oParameters, _this.onVerifySecurityKeyFinish, _this);
    })["catch"](function (err) {
      _this.securityKeyInProgress(false);

      _this.securityKeyError(true);
    });
  } else {
    this.securityKeyInProgress(false);
    this.securityKeyError(true);
    Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_VERIFY_SECURITY_KEY'));
  }
};

CVerifySecondFactorPopup.prototype.onVerifySecurityKeyFinish = function (oResponse) {
  this.securityKeyInProgress(false);

  if (oResponse && oResponse.Result) {
    this.verificationResponse(oResponse);
  } else {
    this.securityKeyError(true);
    Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_VERIFY_SECURITY_KEY'));
  }
};

CVerifySecondFactorPopup.prototype.verifyAuthenticatorCode = function () {
  var oParameters = {
    'Login': this.login(),
    'Password': this.sPassword,
    'Code': this.authenticatorCode()
  };
  this.authenticatorCodeInProgress(true);
  Ajax.send('TwoFactorAuth', 'VerifyAuthenticatorAppCode', oParameters, this.onVerifyAuthenticatorAppCodeResponse, this);
};

CVerifySecondFactorPopup.prototype.onVerifyAuthenticatorAppCodeResponse = function (oResponse) {
  var oResult = oResponse.Result;
  this.authenticatorCodeInProgress(false);
  this.authenticatorCode('');

  if (oResult) {
    this.verificationResponse(oResponse);
  } else {
    Screens.showError(TextUtils.i18n('TWOFACTORAUTH/ERROR_WRONG_CODE'));
  }
};

CVerifySecondFactorPopup.prototype.verifyBackupCode = function () {
  var oParameters = {
    'Login': this.login(),
    'Password': this.sPassword,
    'BackupCode': this.backupCode()
  };
  this.backupCodeInProgress(true);
  Ajax.send('TwoFactorAuth', 'VerifyBackupCode', oParameters, this.onVerifyBackupCode, this);
};

CVerifySecondFactorPopup.prototype.onVerifyBackupCode = function (oResponse) {
  var oResult = oResponse.Result;
  this.backupCodeInProgress(false);
  this.backupCode('');

  if (oResult) {
    this.verificationResponse(oResponse);
  } else {
    Screens.showError(TextUtils.i18n('TWOFACTORAUTH/ERROR_WRONG_BACKUP_CODE'));
  }
};

CVerifySecondFactorPopup.prototype.cancelPopup = function () {
  if (_.isFunction(this.fOnCancel)) {
    this.fOnCancel(false);
  }

  this.closePopup();
};

CVerifySecondFactorPopup.prototype.afterVerify = function () {
  if (this.trustThisBrowser()) {
    var oParameters = {
      'Login': this.login(),
      'Password': this.sPassword,
      'DeviceId': Utils.getUUID(),
      'DeviceName': DeviceUtils.getName(),
      'Trust': this.trustThisBrowser()
    };
    this.continueInProgress(true);
    Ajax.send('TwoFactorAuth', 'TrustDevice', oParameters, function () {
      if (_.isFunction(this.fAfterVerify)) {
        this.fAfterVerify(this.verificationResponse());
      }
    }, this);
  } else if (_.isFunction(this.fAfterVerify)) {
    this.fAfterVerify(this.verificationResponse());
  }
};

module.exports = new CVerifySecondFactorPopup();

/***/ }),

/***/ "2xdY":
/*!*****************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/popups/ConfirmPasswordPopup.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(/*! underscore */ "F/us"),
    ko = __webpack_require__(/*! knockout */ "0h2I"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
    Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
    CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF");
/**
 * @constructor
 */


function CConfirmPasswordPopup() {
  CAbstractPopup.call(this);
  this.fSuccessCallback = null;
  this.password = ko.observable('');
  this.passwordFocus = ko.observable(true);
  this.inProgress = ko.observable(false);
}

_.extendOwn(CConfirmPasswordPopup.prototype, CAbstractPopup.prototype);

CConfirmPasswordPopup.prototype.PopupTemplate = 'TwoFactorAuth_ConfirmPasswordPopup';

CConfirmPasswordPopup.prototype.onOpen = function (fSuccessCallback) {
  this.fSuccessCallback = fSuccessCallback;
  this.password('');
  this.passwordFocus(true);
};

CConfirmPasswordPopup.prototype.verifyPassword = function () {
  var oParameters = {
    'Password': this.password()
  };
  this.inProgress(true);
  Ajax.send('TwoFactorAuth', 'VerifyPassword', oParameters, this.onVerifyPasswordResponse, this);
};

CConfirmPasswordPopup.prototype.onVerifyPasswordResponse = function (oResponse) {
  this.inProgress(false);

  if (oResponse && oResponse.Result) {
    if (_.isFunction(this.fSuccessCallback)) {
      this.fSuccessCallback(this.password());
    }

    this.closePopup();
  } else {
    Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_WRONG_PASSWORD'));
  }
};

module.exports = new CConfirmPasswordPopup();

/***/ }),

/***/ "3eSs":
/*!*****************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/popups/ShowBackupCodesPopup.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

var _ = __webpack_require__(/*! underscore */ "F/us"),
    ko = __webpack_require__(/*! knockout */ "0h2I"),
    moment = __webpack_require__(/*! moment */ "wd/R"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
    Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
    Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
    App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
    CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF"),
    ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ "20Ah"),
    FileSaver = __webpack_require__(/*! modules/CoreWebclient/js/vendors/FileSaver.js */ "uN/E"),
    Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
    WindowOpener = __webpack_require__(/*! modules/CoreWebclient/js/WindowOpener.js */ "ZCBP"),
    Settings = __webpack_require__(/*! modules/TwoFactorAuth/js/Settings.js */ "7Lti");
/**
 * @constructor
 */


function CShowBackupCodesPopup() {
  CAbstractPopup.call(this);
  this.sEditVerificator = '';
  this.backupCodes = ko.observableArray([]);
  this.codesGeneratedDataInfo = ko.observable('');
  this.fCallBack = null;
  this.generatingBackupCodes = ko.observable(false);
  this.generateBackupCodesCommand = Utils.createCommand(this, this.confirmGenerateNewBackupCodes, function () {
    return !this.generatingBackupCodes();
  });
}

_.extendOwn(CShowBackupCodesPopup.prototype, CAbstractPopup.prototype);

CShowBackupCodesPopup.prototype.PopupTemplate = 'TwoFactorAuth_ShowBackupCodesPopup';

CShowBackupCodesPopup.prototype.onOpen = function (sEditVerificator, fCallBack) {
  this.sEditVerificator = sEditVerificator;
  this.fCallBack = fCallBack;

  if (Settings.BackupCodesCount > 0) {
    this.getBackupCodes();
  } else {
    this.backupCodes([]);
    this.codesGeneratedDataInfo('');
    this.generateBackupCodes();
  }
};

CShowBackupCodesPopup.prototype.onClose = function () {
  if (_.isFunction(this.fCallBack)) {
    this.fCallBack(_.without(this.backupCodes(), '').length);
  }
};

CShowBackupCodesPopup.prototype.getBackupCodes = function () {
  this.backupCodes([]);
  this.codesGeneratedDataInfo('');
  this.generatingBackupCodes(true);
  Ajax.send('TwoFactorAuth', 'GetBackupCodes', {
    'Password': this.sEditVerificator
  }, function (Response) {
    this.generatingBackupCodes(false);
    this.parseBackupCodes(Response);
  }, this);
};

CShowBackupCodesPopup.prototype.confirmGenerateNewBackupCodes = function () {
  Popups.showPopup(ConfirmPopup, [TextUtils.i18n('TWOFACTORAUTH/INFO_GET_NEW_CODES'), function (bOk) {
    if (bOk) {
      this.generateBackupCodes();
    }
  }.bind(this), TextUtils.i18n('TWOFACTORAUTH/CONFIRM_GET_NEW_CODES')]);
};

CShowBackupCodesPopup.prototype.generateBackupCodes = function () {
  this.generatingBackupCodes(true);
  Ajax.send('TwoFactorAuth', 'GenerateBackupCodes', {
    'Password': this.sEditVerificator
  }, function (Response) {
    this.generatingBackupCodes(false);
    this.parseBackupCodes(Response);
  }, this);
};

CShowBackupCodesPopup.prototype.parseBackupCodes = function (Response) {
  var oResult = Response && Response.Result,
      aCodes = oResult && oResult.Codes;

  if (Types.isNonEmptyArray(aCodes)) {
    var oMoment = moment.unix(oResult.Datetime);
    this.codesGeneratedDataInfo(TextUtils.i18n('TWOFACTORAUTH/INFO_CODES_GENERATED_DATA', {
      'DATA': oMoment.format('MMM D, YYYY')
    }));
    this.backupCodes(aCodes);
  }
};

CShowBackupCodesPopup.prototype.getBackupCodesFileText = function () {
  var sText = '';
  sText += TextUtils.i18n('TWOFACTORAUTH/HEADING_SAVE_CODES') + '\n';
  sText += TextUtils.i18n('TWOFACTORAUTH/INFO_KEEP_CODES_SAFE') + '\n';
  sText += '\n';

  _.each(this.backupCodes(), function (sCode, iIndex) {
    sText += iIndex + 1 + '. ' + sCode + '\n';
  });

  sText += '\n';
  sText += App.getUserPublicId() + '\n';
  sText += '\n';
  sText += TextUtils.i18n('TWOFACTORAUTH/INFO_USE_CODE_ONCE') + '\n';
  sText += this.codesGeneratedDataInfo() + '\n';
  return sText;
};

CShowBackupCodesPopup.prototype.print = function () {
  var sText = this.getBackupCodesFileText(),
      oWin = WindowOpener.open('', 'backup-codes-' + App.getUserPublicId() + '-print');

  if (oWin) {
    $(oWin.document.body).html('<pre>' + sText + '</pre>');
    oWin.print();
  }
};

CShowBackupCodesPopup.prototype.download = function () {
  var sText = this.getBackupCodesFileText();
  var oBlob = new Blob([sText], {
    'type': 'text/plain;charset=utf-8'
  });
  FileSaver.saveAs(oBlob, 'backup-codes-' + App.getUserPublicId() + '.txt', true);
};

module.exports = new CShowBackupCodesPopup();
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! jquery */ "EVdn")))

/***/ }),

/***/ "7Lti":
/*!**********************************************!*\
  !*** ./modules/TwoFactorAuth/js/Settings.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {

var ko = __webpack_require__(/*! knockout */ "0h2I"),
    _ = __webpack_require__(/*! underscore */ "F/us"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
    App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
    ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
    Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT");

module.exports = {
  ServerModuleName: 'TwoFactorAuth',
  HashModuleName: 'two-factor-auth',
  AuthenticatorAppEnabled: false,
  ShowRecommendationToConfigure: true,
  AllowBackupCodes: false,
  BackupCodesCount: false,
  AllowSecurityKeys: false,
  AllowAuthenticatorApp: false,
  SecurityKeys: [],
  AllowUsedDevices: false,
  CurrentIP: '',
  TrustDevicesForDays: 0,
  AllowTrustedDevices: false,

  /**
   * Initializes settings from AppData object sections.
   *
   * @param {Object} oAppData Object contained modules settings.
   */
  init: function init(oAppData) {
    var oAppDataSection = _.extend({}, oAppData[this.ServerModuleName] || {}, oAppData['TwoFactorAuth'] || {});

    if (!_.isEmpty(oAppDataSection)) {
      this.ShowRecommendationToConfigure = Types.pBool(oAppDataSection.ShowRecommendationToConfigure, this.ShowRecommendationToConfigure);
      this.AllowBackupCodes = Types.pBool(oAppDataSection.AllowBackupCodes, this.AllowBackupCodes);
      this.BackupCodesCount = Types.pInt(oAppDataSection.BackupCodesCount, this.BackupCodesCount);
      this.AllowSecurityKeys = Types.pBool(oAppDataSection.AllowSecurityKeys, this.AllowSecurityKeys);
      this.AllowAuthenticatorApp = Types.pBool(oAppDataSection.AllowAuthenticatorApp, this.AllowAuthenticatorApp);
      this.AuthenticatorAppEnabled = this.AllowAuthenticatorApp && Types.pBool(oAppDataSection.AuthenticatorAppEnabled, this.AuthenticatorAppEnabled);
      this.AllowUsedDevices = Types.pBool(oAppDataSection.AllowUsedDevices, this.AllowUsedDevices);
      this.CurrentIP = Types.pString(oAppDataSection.CurrentIP, this.CurrentIP);
      this.TrustDevicesForDays = Types.pInt(oAppDataSection.TrustDevicesForDays, this.TrustDevicesForDays);
      this.AllowTrustedDevices = this.TrustDevicesForDays > 0;
      this.SecurityKeys = [];

      if (Types.isNonEmptyArray(oAppDataSection.WebAuthKeysInfo)) {
        _.each(oAppDataSection.WebAuthKeysInfo, function (aSecurityKeyData) {
          if (Types.isNonEmptyArray(aSecurityKeyData, 2)) {
            this.SecurityKeys.push({
              'Id': aSecurityKeyData[0],
              'keyName': ko.observable(aSecurityKeyData[1])
            });
          }
        }.bind(this));
      }

      this.checkIfEnabled();
    }
  },
  updateShowRecommendation: function updateShowRecommendation(bShowRecommendationToConfigure) {
    this.ShowRecommendationToConfigure = bShowRecommendationToConfigure;
  },
  updateBackupCodesCount: function updateBackupCodesCount(iBackupCodesCount) {
    this.BackupCodesCount = iBackupCodesCount;
  },
  updateAuthenticatorApp: function updateAuthenticatorApp(bAuthenticatorAppEnabled) {
    this.AuthenticatorAppEnabled = !!bAuthenticatorAppEnabled;
  },
  checkIfEnabled: function checkIfEnabled() {
    if (!App.isMobile() && App.isUserNormalOrTenant() && this.ShowRecommendationToConfigure) {
      var bTfaSettingsOpened = window.location.hash === 'settings/two-factor-auth' || window.location.hash === '#settings/two-factor-auth';
      var bSecuritySettingsOpened = window.location.hash === 'settings/security' || window.location.hash === '#settings/security';

      if (!this.AuthenticatorAppEnabled && !bTfaSettingsOpened && !bSecuritySettingsOpened) {
        setTimeout(function () {
          var sLink = ModulesManager.isModuleEnabled('SecuritySettingsWebclient') ? '#settings/security' : '#settings/two-factor-auth';
          Screens.showLoading(TextUtils.i18n('TWOFACTORAUTH/CONFIRM_MODULE_NOT_ENABLED', {
            'TWO_FACTOR_LINK': sLink
          }));
          $('.report_panel.loading a').on('click', function () {
            Screens.hideLoading();
          });
          setTimeout(function () {
            Screens.hideLoading();
          }, 10000);
        }, 100);
      }
    }
  }
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! jquery */ "EVdn")))

/***/ }),

/***/ "7yJo":
/*!*********************************************************!*\
  !*** ./modules/TwoFactorAuth/js/models/CDeviceModel.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var moment = __webpack_require__(/*! moment */ "wd/R"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
    Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
    Settings = __webpack_require__(/*! modules/TwoFactorAuth/js/Settings.js */ "7Lti");
/**
 * @constructor
 * @param {object} oData
 * @returns {CDeviceModel}
 */


function CDeviceModel(oData) {
  this.sDeviceId = '';
  this.bCurrentDevice = false;
  this.sDeviceName = '';
  this.bAuthenticated = false;
  this.sDeviceExpiresDate = '';
  this.sDeviceLastUsageDate = '';

  if (oData) {
    this.parse(oData);
  }
}
/**
 * @param {Object} oData
 */


CDeviceModel.prototype.parse = function (oData) {
  var oExpMoment = moment.unix(oData.TrustTillDateTime),
      oUsageMoment = moment.unix(oData.LastUsageDateTime);
  this.sDeviceId = Types.pString(oData.DeviceId);
  this.bCurrentDevice = this.sDeviceId === Utils.getUUID();
  this.bAuthenticated = Types.pBool(oData.Authenticated);
  this.sDeviceName = Types.pString(oData.DeviceName);

  if (Settings.AllowTrustedDevices && oExpMoment.diff(moment()) > 0) {
    this.sDeviceExpiresDate = TextUtils.i18n('TWOFACTORAUTH/LABEL_DEVICE_TRUST_TILL_DATE', {
      'EXPDATE': oExpMoment.format('MMM D, YYYY')
    });
  }

  this.sDeviceLastUsageDate = TextUtils.i18n('TWOFACTORAUTH/LABEL_DEVICE_LAST_USAGE_DATE', {
    'USAGEDATE': oUsageMoment.fromNow()
  });
};

module.exports = CDeviceModel;

/***/ }),

/***/ "J4qX":
/*!*******************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/popups/CreateSecurityKeyPopup.js ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(/*! underscore */ "F/us"),
    ko = __webpack_require__(/*! knockout */ "0h2I"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
    Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
    Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
    Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
    CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF"),
    Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
    ConvertUtils = __webpack_require__(/*! modules/TwoFactorAuth/js/utils/Convert.js */ "svu5");
/**
 * @constructor
 */


function CCreateSecurityKeyPopup() {
  CAbstractPopup.call(this);
  this.bSecurityKeysNotSupportedError = !(navigator.credentials && navigator.credentials.create);
  this.bIsHttps = window.location.protocol === 'https:';
  this.sEditVerificator = '';
  this.sName = '';
  this.iId = 0;
  this.name = ko.observable('');
  this.nameFocus = ko.observable(true);
  this.saveNameInProgress = ko.observable(false);
  this.securityKeyInProgress = ko.observable(false);
  this.securityKeyError = ko.observable(false);
  this.securityKeyCanceled = ko.observable(false);
  this.saveCommand = Utils.createCommand(this, this.save, function () {
    return Types.isNonEmptyString(this.name());
  });
}

_.extendOwn(CCreateSecurityKeyPopup.prototype, CAbstractPopup.prototype);

CCreateSecurityKeyPopup.prototype.PopupTemplate = 'TwoFactorAuth_CreateSecurityKeyPopup';

CCreateSecurityKeyPopup.prototype.onOpen = function (sEditVerificator, fCallback) {
  this.sEditVerificator = sEditVerificator;
  this.fCallback = fCallback;
  this.registerSecurityKey();
};

CCreateSecurityKeyPopup.prototype.registerSecurityKey = function (oResponse) {
  if (!this.bSecurityKeysNotSupportedError) {
    this.iId = 0;
    this.name('');
    this.securityKeyInProgress(true);
    this.securityKeyError(false);
    this.securityKeyCanceled(false);
    Ajax.send('TwoFactorAuth', 'RegisterSecurityKeyBegin', {
      'Password': this.sEditVerificator
    }, this.onRegisterSecurityKeyBeginResponse, this);
  } else {
    this.securityKeyInProgress(false);
    this.securityKeyError(true);
  }
};

CCreateSecurityKeyPopup.prototype.onRegisterSecurityKeyBeginResponse = function (oResponse) {
  var _this = this;

  if (oResponse && oResponse.Result) {
    var oCreateArgs = oResponse.Result;
    oCreateArgs.publicKey.challenge = ConvertUtils.base64ToArrayBuffer(oCreateArgs.publicKey.challenge);
    oCreateArgs.publicKey.user.id = ConvertUtils.base64ToArrayBuffer(oCreateArgs.publicKey.user.id);
    navigator.credentials.create(oCreateArgs).then(function (cred) {
      var oParams = {
        'Password': _this.sEditVerificator,
        'Attestation': {
          'attestationObject': ConvertUtils.arrayBufferToBase64(cred.response.attestationObject),
          'clientDataJSON': ConvertUtils.arrayBufferToBase64(cred.response.clientDataJSON)
        }
      };
      Ajax.send('TwoFactorAuth', 'RegisterSecurityKeyFinish', oParams, _this.onRegisterSecurityKeyFinishResponse, _this);
    })["catch"](function (err) {
      _this.securityKeyInProgress(false);

      _this.securityKeyCanceled(true);
    });
  } else {
    this.securityKeyInProgress(false);
    this.closePopup();
    Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_ADD_SECURITY_KEY'));
  }
};

CCreateSecurityKeyPopup.prototype.onRegisterSecurityKeyFinishResponse = function (oResponse) {
  this.securityKeyInProgress(false);

  if (oResponse && oResponse.Result) {
    this.iId = oResponse.Result;
    this.nameFocus(true);
  } else {
    this.closePopup();
    Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_ADD_SECURITY_KEY'));
  }
};

CCreateSecurityKeyPopup.prototype.save = function () {
  if (Types.isNonEmptyString(this.name())) {
    var oParameters = {
      'Password': this.sEditVerificator,
      'KeyId': this.iId,
      'NewName': this.name()
    };
    this.saveNameInProgress(true);
    Ajax.send('TwoFactorAuth', 'UpdateSecurityKeyName', oParameters, this.onUpdateSecurityKeyNameResponse, this);
  }
};

CCreateSecurityKeyPopup.prototype.onUpdateSecurityKeyNameResponse = function (oResponse) {
  this.saveNameInProgress(false);

  if (oResponse && oResponse.Result) {
    if (_.isFunction(this.fCallback)) {
      this.fCallback(this.iId, this.name());
    }

    this.closePopup();
  } else {
    if (_.isFunction(this.fCallback)) {
      this.fCallback(this.iId, '');
    }

    this.closePopup();
    Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_SETUP_SECRET_KEY_NAME'));
  }
};

CCreateSecurityKeyPopup.prototype.cancelPopup = function () {// Do not close until name is specified
  // this.closePopup();
};

CCreateSecurityKeyPopup.prototype.onEscHandler = function (oEvent) {// Do not close until name is specified
  // this.cancelPopup();
};

module.exports = new CCreateSecurityKeyPopup();

/***/ }),

/***/ "PMya":
/*!*************************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/views/TwoFactorAuthSettingsFormView.js ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(/*! underscore */ "F/us"),
    ko = __webpack_require__(/*! knockout */ "0h2I"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
    Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
    Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
    Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
    App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
    ConfirmPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/ConfirmPopup.js */ "20Ah"),
    ModulesManager = __webpack_require__(/*! modules/CoreWebclient/js/ModulesManager.js */ "OgeD"),
    Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
    Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT"),
    UserSettings = __webpack_require__(/*! modules/CoreWebclient/js/Settings.js */ "hPb3"),
    CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
    CDeviceModel = __webpack_require__(/*! modules/TwoFactorAuth/js/models/CDeviceModel.js */ "7yJo"),
    ConfigureAuthenticatorAppPopup = __webpack_require__(/*! modules/TwoFactorAuth/js/popups/ConfigureAuthenticatorAppPopup.js */ "RfyC"),
    ConfirmPasswordPopup = __webpack_require__(/*! modules/TwoFactorAuth/js/popups/ConfirmPasswordPopup.js */ "2xdY"),
    CreateSecurityKeyPopup = __webpack_require__(/*! modules/TwoFactorAuth/js/popups/CreateSecurityKeyPopup.js */ "J4qX"),
    Settings = __webpack_require__(/*! modules/TwoFactorAuth/js/Settings.js */ "7Lti"),
    EditSecurityKeyPopup = __webpack_require__(/*! modules/TwoFactorAuth/js/popups/EditSecurityKeyPopup.js */ "piNw"),
    ShowBackupCodesPopup = __webpack_require__(/*! modules/TwoFactorAuth/js/popups/ShowBackupCodesPopup.js */ "3eSs");
/**
 * @constructor
 */


function CTwoFactorAuthSettingsFormView() {
  CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
  this.visibleHeading = ko.observable(true); // Can be changed by SecuritySettingsWebclient module

  this.showRecommendationToConfigure = ko.observable(Settings.ShowRecommendationToConfigure);
  this.bAllowSecurityKeys = Settings.AllowSecurityKeys;
  this.bAllowAuthenticatorApp = Settings.AllowAuthenticatorApp;
  this.securityKeys = ko.observableArray(Settings.SecurityKeys);
  this.hasBackupCodes = ko.observable(false);
  this.infoShowBackupCodes = ko.observable('');
  this.hasAuthenticatorApp = ko.observable(Settings.AuthenticatorAppEnabled);
  this.isEnabledTwoFactorAuth = ko.computed(function () {
    return this.hasAuthenticatorApp() || this.securityKeys().length > 0;
  }, this);
  this.isEnabledTwoFactorAuth.subscribe(function () {
    if (!this.isEnabledTwoFactorAuth()) {
      Settings.updateBackupCodesCount(0);
      this.populateSettings();
    }
  }, this);
  this.sEditVerificator = '';
  this.passwordVerified = ko.observable(false);
  this.allowBackupCodes = ko.computed(function () {
    return Settings.AllowBackupCodes && (this.hasAuthenticatorApp() || this.securityKeys().length > 0) && this.passwordVerified();
  }, this);
  this.devices = ko.observableArray([]);
  this.allowUsedDevices = ko.computed(function () {
    return Settings.AllowUsedDevices && this.devices().length > 0;
  }, this);
  this.allowRevokeAll = ko.computed(function () {
    return Settings.AllowTrustedDevices && !!_.find(this.devices(), function (oDevice) {
      return Types.isNonEmptyString(oDevice.sDeviceExpiresDate);
    });
  }, this);
  this.bAllowDeviceLogout = UserSettings.StoreAuthTokenInDB;
  this.populateSettings();
  this.revokeAllCommand = Utils.createCommand(this, this.askRevokeTrustFromAllDevices, function () {
    return this.allowRevokeAll();
  });
}

_.extendOwn(CTwoFactorAuthSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CTwoFactorAuthSettingsFormView.prototype.ViewTemplate = 'TwoFactorAuth_TwoFactorAuthSettingsFormView';

CTwoFactorAuthSettingsFormView.prototype.onShow = function () {
  this.clearAll();
};

CTwoFactorAuthSettingsFormView.prototype.clearAll = function () {
  this.sEditVerificator = '';
  this.passwordVerified(false);
  this.populateSettings();
  this.getUsedDevices();
};

CTwoFactorAuthSettingsFormView.prototype.populateSettings = function () {
  this.showRecommendationToConfigure(Settings.ShowRecommendationToConfigure);
  this.hasAuthenticatorApp(Settings.AuthenticatorAppEnabled);
  this.hasBackupCodes(Settings.BackupCodesCount > 0);
  this.infoShowBackupCodes(this.hasBackupCodes() ? TextUtils.i18n('TWOFACTORAUTH/INFO_SHOW_BACKUP_CODES', {
    'COUNT': Settings.BackupCodesCount
  }) : '');
};

CTwoFactorAuthSettingsFormView.prototype.confirmPassword = function () {
  Popups.showPopup(ConfirmPasswordPopup, [function (sEditVerificator) {
    this.sEditVerificator = sEditVerificator;
    this.passwordVerified(true);
  }.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.setupAuthenticatorApp = function () {
  Popups.showPopup(ConfigureAuthenticatorAppPopup, [this.sEditVerificator, function () {
    Settings.updateAuthenticatorApp(true);
    this.populateSettings();
    this.disableShowRecommendation();
  }.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.disableShowRecommendation = function () {
  if (this.showRecommendationToConfigure()) {
    this.showRecommendationToConfigure(false);
    Ajax.send('TwoFactorAuth', 'UpdateSettings', {
      'ShowRecommendationToConfigure': false
    }, function () {
      Settings.updateShowRecommendation(false);
      this.populateSettings();
    }.bind(this));
  }
};

CTwoFactorAuthSettingsFormView.prototype.askDisableAuthenticatorApp = function () {
  var sConfirm = TextUtils.i18n('TWOFACTORAUTH/CONFIRM_DISABLE_AUTHENTICATOR_APP');
  Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bDisableAuthenticatorApp) {
    if (bDisableAuthenticatorApp) {
      this.disableAuthenticatorApp();
    }
  }, this)]);
};

CTwoFactorAuthSettingsFormView.prototype.disableAuthenticatorApp = function () {
  var oParameters = {
    'Password': this.sEditVerificator
  };
  Ajax.send('TwoFactorAuth', 'DisableAuthenticatorApp', oParameters);
  Settings.updateAuthenticatorApp(false);
  this.populateSettings();
};

CTwoFactorAuthSettingsFormView.prototype.showBackupCodes = function () {
  if (this.allowBackupCodes()) {
    Popups.showPopup(ShowBackupCodesPopup, [this.sEditVerificator, function (iBackupCodesCount) {
      Settings.updateBackupCodesCount(iBackupCodesCount);
      this.populateSettings();
    }.bind(this)]);
  }
};

CTwoFactorAuthSettingsFormView.prototype.addSecurityKey = function () {
  Popups.showPopup(CreateSecurityKeyPopup, [this.sEditVerificator, this.addCreatedSecurityKey.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.addCreatedSecurityKey = function (iId, sName) {
  this.securityKeys.push({
    'Id': iId,
    'keyName': ko.observable(sName)
  });
  this.disableShowRecommendation();
};

CTwoFactorAuthSettingsFormView.prototype.askNewSecurityKeyName = function (iId, sName) {
  Popups.showPopup(EditSecurityKeyPopup, [this.sEditVerificator, iId, sName, this.updateSecurityKeyName.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.updateSecurityKeyName = function (iId, sName) {
  _.each(this.securityKeys(), function (oSecurityKey) {
    if (oSecurityKey.Id === iId) {
      oSecurityKey.keyName(sName);
    }
  });

  this.securityKeys.valueHasMutated();
};

CTwoFactorAuthSettingsFormView.prototype.askRemoveSecurityKey = function (iId, sName) {
  var sConfirm = TextUtils.i18n('TWOFACTORAUTH/CONFIRM_REMOVE_SECURITY_KEY', {
    'KEYNAME': sName
  });
  Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bRemoveKey) {
    if (bRemoveKey) {
      this.removeSecurityKey(iId);
    }
  }, this)]);
};

CTwoFactorAuthSettingsFormView.prototype.removeSecurityKey = function (iId) {
  Ajax.send('TwoFactorAuth', 'DeleteSecurityKey', {
    'Password': this.sEditVerificator,
    'KeyId': iId
  }, function (oResponse) {
    if (oResponse && oResponse.Result) {
      this.securityKeys(_.filter(this.securityKeys(), function (oSecurityKey) {
        return oSecurityKey.Id !== iId;
      }));
      Screens.showReport(TextUtils.i18n('TWOFACTORAUTH/REPORT_DELETE_SECURITY_KEY'));
    } else {
      Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_DELETE_SECURITY_KEY'));
    }
  }, this);
};

CTwoFactorAuthSettingsFormView.prototype.getUsedDevices = function () {
  Ajax.send('TwoFactorAuth', 'GetUsedDevices', {}, function (oResponse) {
    var aDevicesData = oResponse && oResponse.Result,
        aDevices = [];

    if (Types.isNonEmptyArray(aDevicesData)) {
      _.each(aDevicesData, function (oDeviceData) {
        var oDevice = new CDeviceModel(oDeviceData);
        aDevices.push(oDevice);
      });
    }

    this.devices(aDevices);
  }, this);
};

CTwoFactorAuthSettingsFormView.prototype.askRevokeTrustFromAllDevices = function () {
  var sConfirm = TextUtils.i18n('TWOFACTORAUTH/CONFIRM_REVOKE_ALL'),
      sHeading = TextUtils.i18n('TWOFACTORAUTH/CONFIRM_HEADING_REVOKE_ALL');
  Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bRevokeAll) {
    if (bRevokeAll) {
      this.revokeTrustFromAllDevices();
    }
  }, this), sHeading]);
};

CTwoFactorAuthSettingsFormView.prototype.revokeTrustFromAllDevices = function () {
  Ajax.send('TwoFactorAuth', 'RevokeTrustFromAllDevices', {}, function (oResponse) {
    this.getUsedDevices();

    if (!(oResponse && oResponse.Result)) {
      Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_REVOKE_TRUST'));
    }
  }, this);
};

CTwoFactorAuthSettingsFormView.prototype.askLogoutFromDevice = function (sDeviceId, sDeviceName) {
  var sConfirm = TextUtils.i18n('TWOFACTORAUTH/CONFIRM_LOGOUT_DEVICE'),
      sHeading = TextUtils.i18n('TWOFACTORAUTH/CONFIRM_HEADING_LOGOUT_DEVICE', {
    'NAME': sDeviceName
  });
  Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bLogout) {
    if (bLogout) {
      this.logoutFromDevice(sDeviceId);
    }
  }, this), sHeading]);
};

CTwoFactorAuthSettingsFormView.prototype.logoutFromDevice = function (sDeviceId) {
  var oParameters = {
    'DeviceId': sDeviceId
  };
  Ajax.send('TwoFactorAuth', 'LogoutFromDevice', oParameters, function (oResponse) {
    this.getUsedDevices();

    if (!oResponse || !oResponse.Result) {
      Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_LOGOUT_DEVICE'));
    }
  }, this);
};

CTwoFactorAuthSettingsFormView.prototype.askRemoveDevice = function (sDeviceId, sDeviceName) {
  var sConfirm = TextUtils.i18n('TWOFACTORAUTH/CONFIRM_LOGOUT_DEVICE'),
      sHeading = TextUtils.i18n('TWOFACTORAUTH/CONFIRM_HEADING_REMOVE_DEVICE', {
    'NAME': sDeviceName
  });
  Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bLogout) {
    if (bLogout) {
      this.removeDevice(sDeviceId);
    }
  }, this), sHeading]);
};

CTwoFactorAuthSettingsFormView.prototype.removeDevice = function (sDeviceId) {
  var oParameters = {
    'DeviceId': sDeviceId
  };
  Ajax.send('TwoFactorAuth', 'RemoveDevice', oParameters, function (oResponse) {
    this.getUsedDevices();

    if (!oResponse || !oResponse.Result) {
      Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_LOGOUT_DEVICE'));
    }
  }, this);
};

module.exports = new CTwoFactorAuthSettingsFormView();

/***/ }),

/***/ "RfyC":
/*!***************************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/popups/ConfigureAuthenticatorAppPopup.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(/*! underscore */ "F/us"),
    ko = __webpack_require__(/*! knockout */ "0h2I"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
    Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
    Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
    Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
    CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF"),
    Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT");
/**
 * @constructor
 */


function CConfigureAuthenticatorAppPopup() {
  CAbstractPopup.call(this);
  this.sEditVerificator = null;
  this.fSuccessCallback = null;
  this.authenticatorQRCodeUrl = ko.observable('');
  this.authenticatorSecret = ko.observable('');
  this.authenticatorCode = ko.observable('');
  this.authenticatorCodeFocus = ko.observable(false);
  this.saveInProgress = ko.observable(false);
  this.qrCodeIsLoading = ko.observable(false);
  this.saveCommand = Utils.createCommand(this, this.save, function () {
    return Types.isNonEmptyString(this.authenticatorQRCodeUrl()) && Types.isNonEmptyString(this.authenticatorSecret()) && Types.isNonEmptyString(this.authenticatorCode());
  });
}

_.extendOwn(CConfigureAuthenticatorAppPopup.prototype, CAbstractPopup.prototype);

CConfigureAuthenticatorAppPopup.prototype.PopupTemplate = 'TwoFactorAuth_ConfigureAuthenticatorAppPopup';

CConfigureAuthenticatorAppPopup.prototype.onOpen = function (sEditVerificator, fSuccessCallback) {
  this.sEditVerificator = sEditVerificator;
  this.fSuccessCallback = fSuccessCallback;
  this.authenticatorQRCodeUrl('');
  this.authenticatorSecret('');
  this.authenticatorCode('');
  this.authenticatorCodeFocus(false);
  this.saveInProgress(false);
  this.qrCodeIsLoading(true);
  this.getAuthenticatorAppData();
};

CConfigureAuthenticatorAppPopup.prototype.getAuthenticatorAppData = function () {
  var oParameters = {
    'Password': this.sEditVerificator
  };
  Ajax.send('TwoFactorAuth', 'RegisterAuthenticatorAppBegin', oParameters, this.onRegisterAuthenticatorAppBeginResponse, this);
};

CConfigureAuthenticatorAppPopup.prototype.onRegisterAuthenticatorAppBeginResponse = function (oResponse) {
  var oResult = oResponse && oResponse.Result;

  if (oResult && oResult.Secret && oResult.QRcode) {
    this.authenticatorQRCodeUrl(oResult.QRcode);
    this.authenticatorSecret(oResult.Secret);
    this.authenticatorCodeFocus(true);
  } else {
    Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_WRONG_PASSWORD'));
  }
};

CConfigureAuthenticatorAppPopup.prototype.save = function () {
  if (Types.isNonEmptyString(this.authenticatorCode())) {
    var oParameters = {
      'Password': this.sEditVerificator,
      'Code': this.authenticatorCode(),
      'Secret': this.authenticatorSecret()
    };
    this.saveInProgress(true);
    Ajax.send('TwoFactorAuth', 'RegisterAuthenticatorAppFinish', oParameters, this.onRegisterAuthenticatorAppFinishResponse, this);
  }
};

CConfigureAuthenticatorAppPopup.prototype.onRegisterAuthenticatorAppFinishResponse = function (Response) {
  this.saveInProgress(false);

  if (Response && Response.Result) {
    if (_.isFunction(this.fSuccessCallback)) {
      this.fSuccessCallback();
    }

    this.closePopup();
  } else {
    Screens.showError(TextUtils.i18n('TWOFACTORAUTH/ERROR_WRONG_CODE'));
  }
};

module.exports = new CConfigureAuthenticatorAppPopup();

/***/ }),

/***/ "Rr39":
/*!*********************************************!*\
  !*** ./modules/TwoFactorAuth/js/manager.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(/*! underscore */ "F/us"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
    Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
    App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5"),
    DeviceUtils = __webpack_require__(/*! modules/TwoFactorAuth/js/utils/Device.js */ "XIpS"),
    Settings = __webpack_require__(/*! modules/TwoFactorAuth/js/Settings.js */ "7Lti");

module.exports = function (oAppData) {
  Settings.init(oAppData);
  return {
    /**
     * Runs before application start. Subscribes to the event before post displaying.
     * 
     * @param {Object} ModulesManager
     */
    start: function start(ModulesManager) {
      if (!App.isMobile()) {
        if (ModulesManager.isModuleEnabled('SecuritySettingsWebclient')) {
          ModulesManager.run('SecuritySettingsWebclient', 'registerSecuritySettingsSection', [function () {
            return __webpack_require__(/*! modules/TwoFactorAuth/js/views/TwoFactorAuthSettingsFormView.js */ "PMya");
          }, 'TwoFactorAuth']);
        } else {
          ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [function () {
            return __webpack_require__(/*! modules/TwoFactorAuth/js/views/TwoFactorAuthSettingsFormView.js */ "PMya");
          }, Settings.HashModuleName, TextUtils.i18n('TWOFACTORAUTH/LABEL_SETTINGS_TAB')]);
        }

        ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [function (resolve) {
          __webpack_require__.e(/*! require.ensure | admin-bundle */ 7).then((function () {
            resolve(__webpack_require__(/*! modules/TwoFactorAuth/js/views/TwoFactorAuthAdminSettingsFormView.js */ "U4UJ"));
          }).bind(null, __webpack_require__)).catch(__webpack_require__.oe);
        }, Settings.HashModuleName, TextUtils.i18n('TWOFACTORAUTH/LABEL_SETTINGS_TAB')]);
      }

      if (App.getUserRole() === Enums.UserRole.Anonymous) {
        var onAfterlLoginFormConstructView = function (oParams) {
          var oLoginScreenView = oParams.View,
              Popups = __webpack_require__(/*! modules/CoreWebclient/js/Popups.js */ "76Kh"),
              VerifySecondFactorPopup = __webpack_require__(/*! modules/TwoFactorAuth/js/popups/VerifySecondFactorPopup.js */ "2h1X");

          if (oLoginScreenView) {
            // Do not completely replace previous onSystemLoginResponse, because it might be already changed by another plugin
            var fOldOnSystemLoginResponse = oLoginScreenView.onSystemLoginResponse.bind(oLoginScreenView);

            if (!_.isFunction(fOldOnSystemLoginResponse)) {
              fOldOnSystemLoginResponse = oLoginScreenView.onSystemLoginResponseBase.bind(oLoginScreenView);
            }

            if (!_.isFunction(fOldOnSystemLoginResponse)) {
              fOldOnSystemLoginResponse = function fOldOnSystemLoginResponse() {};
            }

            oLoginScreenView.onSystemLoginResponse = function (oResponse, oRequest) {
              if (oRequest.Parameters.Domain != undefined) {
                oRequest.Parameters.Login = oRequest.Parameters.Login + '@' + oRequest.Parameters.Domain;
              } //if TwoFactorAuth enabled - trying to verify user token


              var oTwoFactorAuthData = oResponse.Result && oResponse.Result.TwoFactorAuth;

              if (oTwoFactorAuthData) {
                Popups.showPopup(VerifySecondFactorPopup, [_.bind(this.onSystemLoginResponseBase, this), _.bind(function () {
                  this.loading(false);
                }, this), oTwoFactorAuthData, oRequest.Parameters.Login, oRequest.Parameters.Password]);
              } else {
                fOldOnSystemLoginResponse(oResponse, oRequest);
              }
            };
          }
        }.bind(this);

        App.subscribeEvent('StandardLoginFormWebclient::ConstructView::after', onAfterlLoginFormConstructView);
        App.subscribeEvent('MailLoginFormWebclient::ConstructView::after', onAfterlLoginFormConstructView);
      }

      if (App.isUserNormalOrTenant()) {
        var oParameters = {
          'DeviceId': Utils.getUUID(),
          'DeviceName': DeviceUtils.getName()
        };
        Ajax.send('TwoFactorAuth', 'SaveDevice', oParameters);
      }
    }
  };
};

/***/ }),

/***/ "XIpS":
/*!**************************************************!*\
  !*** ./modules/TwoFactorAuth/js/utils/Device.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var UAParser = __webpack_require__(/*! ua-parser-js */ "K4CH"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
    DeviceUtils = {};

DeviceUtils.getName = function () {
  var sUserAgent = navigator.userAgent,
      oUaData = UAParser(Types.pString(sUserAgent)),
      sName = oUaData.browser.name + '/' + oUaData.browser.major,
      sPlatform = oUaData.os.name + ' ' + oUaData.os.version,
      sDeviceName = TextUtils.i18n('TWOFACTORAUTH/LABEL_DEVICE_NAME', {
    'NAME': sName,
    'PLATFORM': sPlatform
  });
  return sDeviceName;
};

module.exports = DeviceUtils;

/***/ }),

/***/ "piNw":
/*!*****************************************************************!*\
  !*** ./modules/TwoFactorAuth/js/popups/EditSecurityKeyPopup.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _ = __webpack_require__(/*! underscore */ "F/us"),
    ko = __webpack_require__(/*! knockout */ "0h2I"),
    TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
    Types = __webpack_require__(/*! modules/CoreWebclient/js/utils/Types.js */ "AFLV"),
    Utils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Common.js */ "Yjhd"),
    Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
    Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
    CAbstractPopup = __webpack_require__(/*! modules/CoreWebclient/js/popups/CAbstractPopup.js */ "czxF"),
    Screens = __webpack_require__(/*! modules/CoreWebclient/js/Screens.js */ "SQrT");
/**
 * @constructor
 */


function CEditSecurityKeyPopup() {
  CAbstractPopup.call(this);
  this.sEditVerificator = '';
  this.sName = '';
  this.iId = 0;
  this.name = ko.observable('');
  this.nameFocus = ko.observable(true);
  this.inProgress = ko.observable(false);
  this.saveCommand = Utils.createCommand(this, this.save, function () {
    return Types.isNonEmptyString(this.name());
  });
}

_.extendOwn(CEditSecurityKeyPopup.prototype, CAbstractPopup.prototype);

CEditSecurityKeyPopup.prototype.PopupTemplate = 'TwoFactorAuth_EditSecurityKeyPopup';

CEditSecurityKeyPopup.prototype.onOpen = function (sEditVerificator, iId, sName, fCallback) {
  this.sEditVerificator = sEditVerificator;
  this.iId = iId;
  this.name(sName);
  this.nameFocus(true);
  this.fCallback = fCallback;
};

CEditSecurityKeyPopup.prototype.save = function () {
  if (Types.isNonEmptyString(this.name())) {
    var oParameters = {
      'Password': this.sEditVerificator,
      'KeyId': this.iId,
      'NewName': this.name()
    };
    this.inProgress(true);
    Ajax.send('TwoFactorAuth', 'UpdateSecurityKeyName', oParameters, this.onUpdateSecurityKeyNameResponse, this);
  }
};

CEditSecurityKeyPopup.prototype.onUpdateSecurityKeyNameResponse = function (oResponse) {
  this.inProgress(false);

  if (oResponse && oResponse.Result) {
    if (_.isFunction(this.fCallback)) {
      this.fCallback(this.iId, this.name());
    }

    this.closePopup();
  } else {
    Api.showErrorByCode(oResponse, TextUtils.i18n('TWOFACTORAUTH/ERROR_SETUP_SECRET_KEY_NAME'));
  }
};

module.exports = new CEditSecurityKeyPopup();

/***/ }),

/***/ "svu5":
/*!***************************************************!*\
  !*** ./modules/TwoFactorAuth/js/utils/Convert.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var ConvertUtils = {};

ConvertUtils.base64ToArrayBuffer = function (sBase64) {
  var sBinary = window.atob(sBase64),
      iLen = sBinary.length,
      oBytes = new Uint8Array(iLen);

  for (var i = 0; i < iLen; i++) {
    oBytes[i] = sBinary.charCodeAt(i);
  }

  return oBytes.buffer;
};

ConvertUtils.arrayBufferToBase64 = function (buffer) {
  var sBinary = '',
      oBytes = new Uint8Array(buffer),
      iLen = oBytes.byteLength;

  for (var i = 0; i < iLen; i++) {
    sBinary += String.fromCharCode(oBytes[i]);
  }

  return window.btoa(sBinary);
};

module.exports = ConvertUtils;

/***/ }),

/***/ "uN/E":
/*!*******************************************************!*\
  !*** ./modules/CoreWebclient/js/vendors/FileSaver.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if ( true && module.exports) {
  module.exports.saveAs = saveAs;
} else if (( true && __webpack_require__(/*! !webpack amd define */ "B9Yq") !== null) && (__webpack_require__(/*! !webpack amd options */ "PDX0") !== null)) {
  !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
    return saveAs;
  }).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
}


/***/ })

}]);