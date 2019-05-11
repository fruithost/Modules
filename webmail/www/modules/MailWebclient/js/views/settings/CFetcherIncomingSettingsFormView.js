'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	CoreAjax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CServerPropertiesView = require('modules/%ModuleName%/js/views/CServerPropertiesView.js')
;

/**
 * @constructor
 * @param {object} oParent
 */
function CFetcherIncomingSettingsFormView(oParent)
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.oParent = oParent;
	
	this.bShown = false;
	
	this.fetcher = ko.observable(null);
	this.idFetcher = ko.observable(null);

	this.isEnabled = ko.observable(true);

	this.incomingLogin = ko.observable('');
	this.sFakePass = '******';
	this.incomingPassword = ko.observable(this.sFakePass);
	this.oIncoming = new CServerPropertiesView(110, 995, 'fetcher_edit_incoming', TextUtils.i18n('%MODULENAME%/LABEL_POP3_SERVER'));

	this.sFetcherFolder = '';
	this.folder = ko.observable('');
	this.options = ko.observableArray([]);
	MailCache.folderList.subscribe(function () {
		this.populateOptions();
	}, this);

	this.leaveMessagesOnServer = ko.observable(false);

	this.passwordIsSelected = ko.observable(false);

	this.defaultOptionsAfterRender = Utils.defaultOptionsAfterRender;
	
	this.fetcherIntervalHint = ko.computed(function () {
		var iCheckIntervalMinutes = this.fetcher() ? this.fetcher().iCheckIntervalMinutes : 0;
		if (iCheckIntervalMinutes !== 0)
		{
			return TextUtils.i18n('%MODULENAME%/INFO_POP3_FETCHER_PLURAL', {'INTERVAL': iCheckIntervalMinutes}, null, iCheckIntervalMinutes);
		}
		return '';
	}, this);
}

_.extendOwn(CFetcherIncomingSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CFetcherIncomingSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_FetcherIncomingSettingsFormView';

/**
 * @param {Object} oFetcher
 */
CFetcherIncomingSettingsFormView.prototype.onShow = function (oFetcher)
{
	this.fetcher(oFetcher && oFetcher.FETCHER ? oFetcher : null);
	this.populateOptions();
	this.populate();
};

/**
 * @param {Function} fShowNewTab
 */
CFetcherIncomingSettingsFormView.prototype.hide = function (fShowNewTab)
{
	this.bShown = false;
	fShowNewTab();
};

CFetcherIncomingSettingsFormView.prototype.populateOptions = function ()
{
	if (this.bShown)
	{
		this.options(MailCache.folderList().getOptions('', true, false, false));
		if (this.sFetcherFolder !== this.folder())
		{
			this.folder(this.sFetcherFolder);
			this.updateSavedState();
		}
	}
};

CFetcherIncomingSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.isEnabled(),
		this.oIncoming.server(),
		this.oIncoming.port(),
		this.oIncoming.ssl(),
		this.incomingPassword(),
		this.folder(),
		this.leaveMessagesOnServer()
	];
};

CFetcherIncomingSettingsFormView.prototype.getParametersForSave = function ()
{
	if (this.fetcher())
	{
		var
			sIncomingPassword = $.trim(this.incomingPassword()),
			oParameters = {
				'FetcherId': this.idFetcher(),
				'IsEnabled': this.isEnabled(),
				'Folder': this.folder(),
				'IncomingServer': this.oIncoming.server(),
				'IncomingPort': this.oIncoming.getIntPort(),
				'IncomingUseSsl': this.oIncoming.ssl(),
				'LeaveMessagesOnServer': this.leaveMessagesOnServer()
			}
		;
		if (sIncomingPassword !== '' && sIncomingPassword !== this.sFakePass)
		{
			oParameters['IncomingPassword'] = sIncomingPassword;
		}
		return oParameters;
	}
	
	return {};
};

CFetcherIncomingSettingsFormView.prototype.save = function ()
{
	if (this.isEmptyRequiredFields())
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_REQUIRED_FIELDS_EMPTY'));
	}
	else
	{
		this.isSaving(true);

		this.updateSavedState();

		CoreAjax.send(Settings.FetchersServerModuleName, 'UpdateFetcher', this.getParametersForSave(), this.onResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CFetcherIncomingSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_UNKNOWN'));
	}
	else
	{
		AccountList.populateFetchers();
		
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_SUCCESSFULLY_SAVED'));
	}
};

CFetcherIncomingSettingsFormView.prototype.populate = function ()
{
	var oFetcher = this.fetcher();
	
	if (oFetcher)
	{
		this.sFetcherFolder = oFetcher.folder();

		this.idFetcher(oFetcher.id());

		this.isEnabled(oFetcher.isEnabled());

		this.folder(oFetcher.folder());
		this.oIncoming.set(oFetcher.incomingServer(), oFetcher.incomingPort(), oFetcher.incomingUseSsl());
		this.incomingLogin(oFetcher.incomingLogin());
		this.incomingPassword(this.sFakePass);
		this.leaveMessagesOnServer(oFetcher.leaveMessagesOnServer());

		this.updateSavedState();
	}
};
CFetcherIncomingSettingsFormView.prototype.isEmptyRequiredFields = function ()
{
	if (this.oIncoming.server() === '')
	{
		this.oIncoming.server.focused(true);
		return true;
	}
	
	if ($.trim(this.incomingPassword()) === '')
	{
		this.passwordIsSelected(true);
		return true;
	}
	
	return false;
};

CFetcherIncomingSettingsFormView.prototype.remove = function ()
{
	var
		oFetcher = this.fetcher(),
		fCallBack = function (bOkAnswer) {
			if (bOkAnswer)
			{
				var oParameters = {
					'FetcherId': oFetcher.id()
				};

				CoreAjax.send(Settings.FetchersServerModuleName, 'DeleteFetcher', oParameters, this.onAccountDeleteFetcherResponse, this);

				if (this.oParent && _.isFunction(this.oParent.onRemoveFetcher))
				{
					this.oParent.onRemoveFetcher();
				}
			}
		}.bind(this)
	;
	
	if (oFetcher)
	{
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_FETCHER'), fCallBack, oFetcher.incomingLogin()]);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CFetcherIncomingSettingsFormView.prototype.onAccountDeleteFetcherResponse = function (oResponse, oRequest)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_FETCHER_DELETING'));
	}
	AccountList.populateFetchers();
};

module.exports = CFetcherIncomingSettingsFormView;
