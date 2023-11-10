'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	CreateFolderPopup = require('modules/%ModuleName%/js/popups/CreateFolderPopup.js'),
	SetSystemFoldersPopup = require('modules/%ModuleName%/js/popups/SetSystemFoldersPopup.js'),
	ImportExportPopup = ModulesManager.run('ImportExportMailPlugin', 'getImportExportPopup'),
	
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	MailCache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

require('modules/%ModuleName%/js/vendors/knockout-sortable.js');

/**
 * @constructor
 */ 
function CAccountFoldersPaneView()
{
	this.bAllowTemplateFolders = Settings.AllowTemplateFolders;
	
	this.highlighted = ko.observable(false).extend({'autoResetToFalse': 500});

	this.collection = ko.observableArray(MailCache.editedFolderList().collection());
	this.oCollSubscription = MailCache.editedFolderList().collection.subscribe(function (koCollection) {
		this.collection(koCollection);
	}, this);
	this.totalMessageCount = ko.observable(0);
	
	this.enableButtons = ko.computed(function () {
		return MailCache.editedFolderList().initialized();
	}, this);
	
	MailCache.editedFolderList.subscribe(function(oFolderList) {
		this.collection(oFolderList.collection());
		this.setTotalMessageCount();
		this.oCollSubscription.dispose();
		this.oCollSubscription = oFolderList.collection.subscribe(function (koCollection) {
			this.collection(koCollection);
		}, this);
	}, this);
	
	this.addNewFolderCommand = Utils.createCommand(this, this.addNewFolder, this.enableButtons);
	this.setSystemFoldersCommand = Utils.createCommand(this, this.setSystemFolders, this.enableButtons);
	
	this.showMovedWithMouseItem = ko.computed(function () {
		return !App.isMobile();
	}, this);
	this.allowImportExport = ko.observable(ModulesManager.isModuleEnabled('ImportExportMailPlugin'));
	App.subscribeEvent('%ModuleName%::AttemptDeleteNonemptyFolder', _.bind(function () {
		this.highlighted(true);
	}, this));
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': 'CAccountFoldersPaneView', 'View': this});
	
	this.afterMove = _.debounce(_.bind(this.folderListOrderUpdate, this), 3000);
}

CAccountFoldersPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountFoldersPaneView';

CAccountFoldersPaneView.prototype.folderListOrderUpdate = function ()
{
	var
		aLinedCollection = MailCache.editedFolderList().repopulateLinedCollection(),
		oParameters = {
			'AccountID': AccountList.editedId(),
			'FolderList': _.compact(_.map(aLinedCollection, function (oFolder) {
				if (!oFolder.bVirtual)
				{
					return oFolder.fullName();
				}
			}))
		}
	;
	
	Ajax.send('UpdateFoldersOrder', oParameters, function (oResponse) {
		if (!oResponse.Result)
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CHANGE_FOLDERS_ORDER'));
			MailCache.getFolderList(AccountList.editedId());
		}
	}, this);
};

CAccountFoldersPaneView.prototype.hide = function (fAfterHideHandler)
{
	var iAccountId = AccountList.editedId();
	_.delay(function () {
		MailCache.getFolderList(iAccountId);
	}, 3000);
	
	if ($.isFunction(fAfterHideHandler))
	{
		fAfterHideHandler();
	}
};

CAccountFoldersPaneView.prototype.show = function ()
{
	this.setTotalMessageCount();
};

CAccountFoldersPaneView.prototype.setTotalMessageCount = function ()
{
	var oFolderList = MailCache.editedFolderList();
	if (oFolderList.iAccountId === 0)
	{
		this.totalMessageCount(0);
	}
	else
	{
		this.totalMessageCount(oFolderList.getTotalMessageCount());
		if (!oFolderList.countsCompletelyFilled())
		{
			if (oFolderList.countsCompletelyFilledSubscribtion)
			{
				oFolderList.countsCompletelyFilledSubscribtion.dispose();
				oFolderList.countsCompletelyFilledSubscribtion = null;
			}
			oFolderList.countsCompletelyFilledSubscribtion = oFolderList.countsCompletelyFilled.subscribe(function () {
				if (oFolderList.countsCompletelyFilled())
				{
					this.totalMessageCount(oFolderList.getTotalMessageCount());
					oFolderList.countsCompletelyFilledSubscribtion.dispose();
					oFolderList.countsCompletelyFilledSubscribtion = null;
				}
			}, this);
		}
	}
};

CAccountFoldersPaneView.prototype.addNewFolder = function ()
{
	Popups.showPopup(CreateFolderPopup);
};

CAccountFoldersPaneView.prototype.setSystemFolders = function ()
{
	Popups.showPopup(SetSystemFoldersPopup);
};

CAccountFoldersPaneView.prototype.importExport = function ()
{
	if (this.allowImportExport())
	{
		Popups.showPopup(ImportExportPopup, [{
		}]);
	}
};

module.exports = new CAccountFoldersPaneView();
