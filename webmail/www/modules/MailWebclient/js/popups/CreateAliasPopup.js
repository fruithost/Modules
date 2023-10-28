'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	CoreAjax = require('%PathToCoreWebclientModule%/js/Ajax.js')
;

/**
 * @constructor
 */
function CreateAliasPopup()
{
	CAbstractPopup.call(this);

	this.iAccountId = 0;
	this.aliasName = ko.observable('');
	this.loading = ko.observable(false);
	this.selectedDomain = ko.observable(null);
	this.domainList = ko.observableArray([]);
}

_.extendOwn(CreateAliasPopup.prototype, CAbstractPopup.prototype);

CreateAliasPopup.prototype.PopupTemplate = '%ModuleName%_Settings_CreateAliasPopup';

/**
 * @param {number} iAccountId
 */
CreateAliasPopup.prototype.onOpen = function (iAccountId)
{
	this.iAccountId = iAccountId;
	this.getDomainList();
};

CreateAliasPopup.prototype.onClose = function ()
{
	this.aliasName('');
};

CreateAliasPopup.prototype.save = function ()
{
	if (this.aliasName() === '')
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_REQUIRED_FIELDS_EMPTY'));
	}
	else
	{
		var
			oParameters = {
				'AliasName': this.aliasName(),
				'AliasDomain': this.selectedDomain()
			}
		;

		this.loading(true);
		CoreAjax.send(Settings.AliasesServerModuleName, 'AddNewAlias', oParameters, this.onCreateAliasResponse, this);
	}
};

CreateAliasPopup.prototype.getDomainList = function ()
{
	var
		iServerId = AccountList.getCurrent().serverId(),
		iTenantId = _.isFunction(App.getTenantId) ? App.getTenantId() : 0
	;

	Ajax.send('GetServerDomains',
		{
			ServerId: iServerId, 
			TenantId: iTenantId
		},
		this.onGetDomainListResponse,
		this
	);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CreateAliasPopup.prototype.onGetDomainListResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		this.domainList(oResponse.Result);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CreateAliasPopup.prototype.onCreateAliasResponse = function (oResponse, oRequest)
{
	this.loading(false);
	if (oResponse.Result)
	{
		AccountList.populateAliases(function () {
			var
				oCurrAccount = AccountList.getCurrent(),
				aCurrAliases = oCurrAccount.aliases(),
				oCreatedAlias = _.find(aCurrAliases, function (oAlias) {
					return oAlias.id() === oResponse.Result;
				})
			;
			if (oCreatedAlias)
			{
				ModulesManager.run('SettingsWebclient', 'setAddHash', [['alias', oCreatedAlias.hash()]]);
			}
		});
		this.closePopup();
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_UNKNOWN'));
	}
};

module.exports = new CreateAliasPopup();
