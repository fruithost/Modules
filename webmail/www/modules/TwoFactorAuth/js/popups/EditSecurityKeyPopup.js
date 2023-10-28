'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
;

/**
 * @constructor
 */
function CEditSecurityKeyPopup()
{
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

CEditSecurityKeyPopup.prototype.PopupTemplate = '%ModuleName%_EditSecurityKeyPopup';

CEditSecurityKeyPopup.prototype.onOpen = function (sEditVerificator, iId, sName, fCallback)
{
	this.sEditVerificator = sEditVerificator;
	this.iId = iId;
	this.name(sName);
	this.nameFocus(true);
	this.fCallback = fCallback;
};

CEditSecurityKeyPopup.prototype.save = function ()
{
	if (Types.isNonEmptyString(this.name()))
	{
		var oParameters = {
			'Password': this.sEditVerificator,
			'KeyId': this.iId,
			'NewName': this.name()
		};
		this.inProgress(true);
		Ajax.send('%ModuleName%', 'UpdateSecurityKeyName', oParameters, this.onUpdateSecurityKeyNameResponse, this);
	}
};

CEditSecurityKeyPopup.prototype.onUpdateSecurityKeyNameResponse = function (oResponse)
{
	this.inProgress(false);
	if (oResponse && oResponse.Result)
	{
		if (_.isFunction(this.fCallback))
		{
			this.fCallback(this.iId, this.name());
		}
		this.closePopup();
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_SETUP_SECRET_KEY_NAME'));
	}
};

module.exports = new CEditSecurityKeyPopup();
