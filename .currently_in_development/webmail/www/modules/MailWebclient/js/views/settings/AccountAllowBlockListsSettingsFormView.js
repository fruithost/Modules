'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CAutoresponderModel = require('modules/%ModuleName%/js/models/CAutoresponderModel.js')
;

/**
 * @constructor
 */ 
function CAccountAllowBlockListsSettingsFormView()
{
	CAbstractSettingsFormView.call(this, '%ModuleName%');
	
	this.allowList = ko.observable('');
	this.blockList = ko.observable('');
}

_.extendOwn(CAccountAllowBlockListsSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CAccountAllowBlockListsSettingsFormView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountAllowBlockListsSettingsFormView';

CAccountAllowBlockListsSettingsFormView.prototype.getCurrentValues = function ()
{
	return [
		this.allowList(),
		this.blockList()	
	];
};

CAccountAllowBlockListsSettingsFormView.prototype.onShow = function ()
{
	this.populate();
};

CAccountAllowBlockListsSettingsFormView.prototype.revert = function ()
{
	this.populate();
};

CAccountAllowBlockListsSettingsFormView.prototype.getParametersForSave = function ()
{
	return {
		'AccountID': AccountList.editedId(),
		'AllowList': this.allowList() !== '' ? this.allowList().split('\n') : [],
		'BlockList': this.blockList() !== '' ? this.blockList().split('\n') : []
	};
};

CAccountAllowBlockListsSettingsFormView.prototype.save = function ()
{
	this.isSaving(true);
	
	this.updateSavedState();
	
	Ajax.send('SetAllowBlockLists', this.getParametersForSave(), this.onResponse, this);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountAllowBlockListsSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (oResponse.Result === false)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
};

CAccountAllowBlockListsSettingsFormView.prototype.populate = function()
{
	var oAccount = AccountList.getEdited();
	
	if (oAccount)
	{
		Ajax.send('GetAllowBlockLists', {'AccountID': oAccount.id()}, this.onGetAllowBlockListsResponse, this);
	}
	
	this.updateSavedState();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAccountAllowBlockListsSettingsFormView.prototype.onGetAllowBlockListsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse && oResponse.Result;
	if (oResult)
	{
		var
			aAllowList = Types.pArray(oResult.AllowList),
			aBlockList = Types.pArray(oResult.BlockList)
		;
		
		this.allowList(aAllowList.join('\n'));
		this.blockList(aBlockList.join('\n'));

		this.updateSavedState();
	}
};

module.exports = new CAccountAllowBlockListsSettingsFormView();
