'use strict';

var
	_ = require('underscore'),
			
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	
	CIdentityModel = require('modules/%ModuleName%/js/models/CIdentityModel.js'),
	CIdentitySettingsFormView = require('modules/%ModuleName%/js/views/settings/CIdentitySettingsFormView.js')
;

/**
 * @constructor
 */
function CCreateIdentityPopup()
{
	CAbstractPopup.call(this);
	
	this.oIdentitySettingsFormView = new CIdentitySettingsFormView(this, true);
}

_.extendOwn(CCreateIdentityPopup.prototype, CAbstractPopup.prototype);

CCreateIdentityPopup.prototype.PopupTemplate = '%ModuleName%_Settings_CreateIdentityPopup';

/**
 * @param {number} iAccountId
 */
CCreateIdentityPopup.prototype.onOpen = function (iAccountId)
{
	var
		oAccount = AccountList.getAccount(iAccountId),
		oIdentity = new CIdentityModel()
	;
	
	oIdentity.accountId(iAccountId);
	oIdentity.email(oAccount.email());
	this.oIdentitySettingsFormView.onShow(oIdentity);
	this.oIdentitySettingsFormView.populate();
	this.oIdentitySettingsFormView.friendlyNameHasFocus(true);
};

module.exports = new CCreateIdentityPopup();
