'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),

	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	GenerateKeyPopup = require('modules/%ModuleName%/js/popups/GenerateKeyPopup.js'),
	ImportKeyPopup = require('modules/%ModuleName%/js/popups/ImportKeyPopup.js'),
	ShowKeyArmorPopup = require('modules/%ModuleName%/js/popups/ShowKeyArmorPopup.js'),
	ShowPublicKeysArmorPopup = require('modules/%ModuleName%/js/popups/ShowPublicKeysArmorPopup.js'),
	VerifyPasswordPopup = require('modules/%ModuleName%/js/popups/VerifyPasswordPopup.js'),

	OpenPgp = require('modules/%ModuleName%/js/OpenPgp.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function COpenPgpSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.enableOpenPgp = ko.observable(Settings.enableOpenPgp());
	this.rememberPassphrase = Settings.rememberPassphrase;
	this.isMailAvailable = ModulesManager.isModuleAvailable('Mail');

	this.keys = ko.observableArray(OpenPgp.getKeys());
	OpenPgp.getKeysObservable().subscribe(function () {
		this.keys(OpenPgp.getKeys());
	}, this);

	this.publicKeys = ko.computed(function () {
		var
			aPublicKeys = _.filter(this.keys(), function (oKey) {
				return oKey.isPublic() && !oKey.isExternal;
			})
		;
		return _.map(aPublicKeys, function (oKey) {
			return {'user': oKey.getUser(), 'armor': oKey.getArmor(), 'key': oKey, 'private': false};
		});
	}, this);
	this.privateKeys = ko.computed(function () {
		var
			aPrivateKeys = _.filter(this.keys(), function (oKey) {
				return oKey.isPrivate()&&!oKey.isExternal;
			})
		;
		return  _.map(aPrivateKeys, function (oKey) {
			return {'user': oKey.getUser(), 'armor': oKey.getArmor(), 'key': oKey};
		});
	}, this);
	this.externalPublicKeys = ko.computed(function () {
		var
			aPublicKeys = _.filter(this.keys(), function (oKey) {
				return oKey.isPublic() && oKey.isExternal;
			})
		;
		return _.map(aPublicKeys, function (oKey) {
			return {'user': oKey.getUser(), 'armor': oKey.getArmor(), 'key': oKey, 'private': false};
		});
	}, this);
}

_.extendOwn(COpenPgpSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

COpenPgpSettingsFormView.prototype.ViewTemplate = '%ModuleName%_OpenPgpSettingsFormView';

COpenPgpSettingsFormView.prototype.exportAllPublicKeys = function ()
{
	var
		aArmors = _.map(_.union(this.publicKeys(), this.externalPublicKeys()), function (oKey) {
			return oKey.armor;
		})
	;

	if (aArmors.length > 0)
	{
		Popups.showPopup(ShowPublicKeysArmorPopup, [aArmors.join('\n')]);
	}
};

COpenPgpSettingsFormView.prototype.importKey = function ()
{
	Popups.showPopup(ImportKeyPopup);
};

COpenPgpSettingsFormView.prototype.generateNewKey = function ()
{
	Popups.showPopup(GenerateKeyPopup);
};

/**
 * @param {Object} oKey
 */
COpenPgpSettingsFormView.prototype.removeOpenPgpKey = function (oKey)
{
	var
		sConfirm = '',
		fRemove = _.bind(async function (bRemove) {
			if (bRemove)
			{
				var oRes = await OpenPgp.deleteKey(oKey);
				if (!oRes.result)
				{
					Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_DELETE_KEY'));
				}
			}
		}, this)
	;

	if (oKey)
	{
		sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_DELETE_KEY', {'KEYEMAIL': oKey.getEmail()});
		Popups.showPopup(ConfirmPopup, [sConfirm, fRemove]);
	}
};

/**
 * @param {Object} oKey
 */
COpenPgpSettingsFormView.prototype.verifyPassword = function (oKey)
{
	var fShowArmor = function () {
		this.showArmor(oKey);
	}.bind(this);

	Popups.showPopup(VerifyPasswordPopup, [oKey, fShowArmor]);
};

/**
 * @param {Object} oKey
 */
COpenPgpSettingsFormView.prototype.showArmor = function (oKey)
{
	Popups.showPopup(ShowKeyArmorPopup, [oKey]);
};

COpenPgpSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.enableOpenPgp(),
		this.rememberPassphrase()
	];
};

COpenPgpSettingsFormView.prototype.revertGlobalValues = function ()
{
	this.enableOpenPgp(Settings.enableOpenPgp());
	this.rememberPassphrase(Settings.rememberPassphrase());
};

COpenPgpSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'EnableModule': this.enableOpenPgp(),
		'RememberPassphrase': this.rememberPassphrase()
	};
};

COpenPgpSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	Settings.update(oParameters.EnableModule);
};

module.exports = new COpenPgpSettingsFormView();
