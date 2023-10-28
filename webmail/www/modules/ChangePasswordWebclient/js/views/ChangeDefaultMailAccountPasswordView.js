'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ChangePasswordPopup = ModulesManager.run('ChangePasswordWebclient', 'getChangePasswordPopup'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CChangeDefaultMailAccountPasswordView()
{
	this.oDefaultAccount = null;
	this.showChangePasswordButton = ko.observable(false);
	this.changePasswordHintText = ko.observable('');
	this.init();
}

CChangeDefaultMailAccountPasswordView.prototype.ViewTemplate = '%ModuleName%_ChangeDefaultMailAccountPasswordView';

CChangeDefaultMailAccountPasswordView.prototype.init = function ()
{
	var
		oAccountList = ModulesManager.run('MailWebclient', 'getAccountList', []),
		fCheckAccountList = function () {
			var oDefaultAccount = oAccountList.getDefault();
			if (oDefaultAccount && oDefaultAccount.aExtend.AllowChangePasswordOnMailServer)
			{
				this.oDefaultAccount = oDefaultAccount;
				this.showChangePasswordButton(true);
				this.changePasswordHintText(TextUtils.i18n('%MODULENAME%/HINT_CHANGE_PASSWORD', {
					'EMAIL': oDefaultAccount.email()
				}));
			}
			else
			{
				this.oDefaultAccount = null;
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

CChangeDefaultMailAccountPasswordView.prototype.changePassword = function ()
{
	if (this.oDefaultAccount)
	{
		Popups.showPopup(ChangePasswordPopup, [{
			iAccountId: this.oDefaultAccount.id(),
			sModule: 'Mail',
			bHasOldPassword: true
		}]);
	}
};

module.exports = new CChangeDefaultMailAccountPasswordView();
