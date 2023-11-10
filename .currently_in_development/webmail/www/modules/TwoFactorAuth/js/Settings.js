'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
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
	init: function (oAppData)
	{
		var oAppDataSection = _.extend({}, oAppData[this.ServerModuleName] || {}, oAppData['%ModuleName%'] || {});
		if (!_.isEmpty(oAppDataSection))
		{
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
			if (Types.isNonEmptyArray(oAppDataSection.WebAuthKeysInfo))
			{
				_.each(oAppDataSection.WebAuthKeysInfo, function (aSecurityKeyData) {
					if (Types.isNonEmptyArray(aSecurityKeyData, 2))
					{
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

	updateShowRecommendation: function (bShowRecommendationToConfigure)
	{
		this.ShowRecommendationToConfigure = bShowRecommendationToConfigure;
	},

	updateBackupCodesCount: function (iBackupCodesCount)
	{
		this.BackupCodesCount = iBackupCodesCount;
	},

	updateAuthenticatorApp: function (bAuthenticatorAppEnabled)
	{
		this.AuthenticatorAppEnabled = !!bAuthenticatorAppEnabled;
	},

	checkIfEnabled: function ()
	{
		if (!App.isMobile() && App.isUserNormalOrTenant() && this.ShowRecommendationToConfigure)
		{
			var bTfaSettingsOpened = window.location.hash === 'settings/two-factor-auth' || window.location.hash === '#settings/two-factor-auth';
			var bSecuritySettingsOpened = window.location.hash === 'settings/security' || window.location.hash === '#settings/security';
			if (!this.AuthenticatorAppEnabled && !bTfaSettingsOpened && !bSecuritySettingsOpened)
			{
				setTimeout(function () {
					var sLink = ModulesManager.isModuleEnabled('SecuritySettingsWebclient')
								? '#settings/security'
								: '#settings/two-factor-auth';
					Screens.showLoading(TextUtils.i18n('%MODULENAME%/CONFIRM_MODULE_NOT_ENABLED', { 'TWO_FACTOR_LINK': sLink }));

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
