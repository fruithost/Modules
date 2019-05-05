'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	
	ContactsCache = require('modules/%ModuleName%/js/Cache.js'),
	HeaderItemView = !App.isNewTab() ? require('modules/%ModuleName%/js/views/HeaderItemView.js') : null,
	MainTab = (App.isNewTab() && window.opener) ? window.opener.MainTabContactsMethods : null
;

/**
 * @constructor
 */
function CVcardModel()
{
	this.uid = ko.observable('');
	this.file = ko.observable('');
	this.name = ko.observable('');
	this.email = ko.observable('');
	this.exists = ko.observable(false);
	this.isJustSaved = ko.observable(false);
}

/**
 * @param {AjaxVCardResponse} oData
 */
CVcardModel.prototype.parse = function (oData)
{
	if (oData && oData['@Object'] === 'Object/Aurora\\Modules\\Mail\\Classes\\Vcard')
	{
		this.uid(Types.pString(oData.Uid));
		this.file(Types.pString(oData.File));
		this.name(Types.pString(oData.Name));
		this.email(Types.pString(oData.Email));
		this.exists(!!oData.Exists);
		
		ContactsCache.addVcard(this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CVcardModel.prototype.onContactsSaveVcfResponse = function (oResponse, oRequest)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CREATE_CONTACT'));
		this.exists(false);
	}
	else
	{
		this.uid(oResponse.Result.Uid);
	}
};

CVcardModel.prototype.addContact = function ()
{
	Ajax.send('AddContactsFromFile', {'File': this.file()}, this.onContactsSaveVcfResponse, this);
	
	this.isJustSaved(true);
	this.exists(true);
	
	setTimeout(_.bind(function () {
		this.isJustSaved(false);
	}, this), 20000);
	
	if (HeaderItemView)
	{
		HeaderItemView.recivedAnim(true);
	}
	else if (MainTab)
	{
		MainTab.markVcardsExistentByFile(this.file());
	}
};

module.exports = CVcardModel;
