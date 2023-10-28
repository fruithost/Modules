'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	CreateAccountShortFormPopup = require('modules/%ModuleName%/js/popups/CreateAccountShortFormPopup.js'),
	CreateIdentityPopup = require('modules/%ModuleName%/js/popups/CreateIdentityPopup.js'),
	CreateFetcherPopup = require('modules/%ModuleName%/js/popups/CreateFetcherPopup.js'),
	CreateAliasPopup = require('modules/%ModuleName%/js/popups/CreateAliasPopup.js'),

	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	AccountList = require('modules/%ModuleName%/js/AccountList.js'),
	CServerModel = require('modules/%ModuleName%/js/models/CServerModel.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),

	AccountAutoresponderSettingsFormView = require('modules/%ModuleName%/js/views/settings/AccountAutoresponderSettingsFormView.js'),
	AccountAllowBlockListsSettingsFormView = require('modules/%ModuleName%/js/views/settings/AccountAllowBlockListsSettingsFormView.js'),
	AccountFiltersSettingsFormView = require('modules/%ModuleName%/js/views/settings/AccountFiltersSettingsFormView.js'),
	AccountFoldersPaneView = require('modules/%ModuleName%/js/views/settings/AccountFoldersPaneView.js'),
	AccountForwardSettingsFormView = require('modules/%ModuleName%/js/views/settings/AccountForwardSettingsFormView.js'),
	AccountSettingsFormView = require('modules/%ModuleName%/js/views/settings/AccountSettingsFormView.js'),
	AccountUnifiedMailboxFormView = require('modules/%ModuleName%/js/views/settings/AccountUnifiedMailboxFormView.js'),
	CIdentitySettingsFormView = require('modules/%ModuleName%/js/views/settings/CIdentitySettingsFormView.js'),
	CFetcherIncomingSettingsFormView = require('modules/%ModuleName%/js/views/settings/CFetcherIncomingSettingsFormView.js'),
	CAliasSettingsFormView = require('modules/%ModuleName%/js/views/settings/CAliasSettingsFormView.js'),
	FetcherOutgoingSettingsFormView = require('modules/%ModuleName%/js/views/settings/FetcherOutgoingSettingsFormView.js'),
	SignatureSettingsFormView = require('modules/%ModuleName%/js/views/settings/SignatureSettingsFormView.js')
;

/**
 * @constructor
 */
function CAccountsSettingsPaneView()
{
	this.bAllowAddAccounts = Settings.AllowAddAccounts;
	this.bAllowMultiAccounts = Settings.AllowMultiAccounts;
	this.bAllowIdentities = !!Settings.AllowIdentities;
	this.bAllowFetchers = !!Settings.AllowFetchers;
	this.bAllowAliases = !!Settings.AllowAliases;

	this.accounts = AccountList.collection;

	this.editedAccountId = AccountList.editedId;
	this.editedFetcher = ko.observable(null);
	this.editedFetcherId = ko.computed(function () {
		return this.editedFetcher() ? this.editedFetcher().id() : null;
	}, this);
	this.editedIdentity = ko.observable(null);
	this.editedIdentityId = ko.computed(function () {
		return this.editedIdentity() ? this.editedIdentity().id() : null;
	}, this);
	this.editedAlias = ko.observable(null);
	this.editedAliasId = ko.computed(function () {
		return this.editedAlias() ? this.editedAlias().id() : null;
	}, this);

	this.allowFolders = ko.observable(false);
	this.allowForward = ko.observable(false);
	this.allowAutoresponder = ko.observable(false);
	this.allowFilters = ko.observable(false);
	this.allowSignature = ko.observable(false);
	this.visibleAllowBlockLists = ko.observable(false);

	this.aAccountTabs = [
		{
			name: 'properties',
			title: TextUtils.i18n('%MODULENAME%/LABEL_PROPERTIES_TAB'),
			view: AccountSettingsFormView,
			visible: AccountSettingsFormView.visibleTab
		},
		{
			name: 'unified',
			title: TextUtils.i18n('%MODULENAME%/LABEL_UNIFIED_MAILBOX_TAB'),
			view: AccountUnifiedMailboxFormView,
			visible: AccountUnifiedMailboxFormView.visibleTab
		},
		{
			name: 'folders',
			title: TextUtils.i18n('%MODULENAME%/LABEL_MANAGE_FOLDERS_TAB'),
			view: AccountFoldersPaneView,
			visible: this.allowFolders
		},
		{
			name: 'forward',
			title: TextUtils.i18n('%MODULENAME%/LABEL_FORWARD_TAB'),
			view: AccountForwardSettingsFormView,
			visible: this.allowForward
		},
		{
			name: 'autoresponder',
			title: TextUtils.i18n('%MODULENAME%/LABEL_AUTORESPONDER_TAB'),
			view: AccountAutoresponderSettingsFormView,
			visible: this.allowAutoresponder
		},
		{
			name: 'filters',
			title: TextUtils.i18n('%MODULENAME%/LABEL_FILTERS_TAB'),
			view: AccountFiltersSettingsFormView,
			visible: this.allowFilters
		},
		{
			name: 'signature',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SIGNATURE_TAB'),
			view: SignatureSettingsFormView,
			visible: this.allowSignature
		},
		{
			name: 'allow-block-lists',
			title: TextUtils.i18n('%MODULENAME%/LABEL_ALLOW_BLOCK_LISTS_TAB'),
			view: AccountAllowBlockListsSettingsFormView,
			visible: this.visibleAllowBlockLists
		}
	];

	this.aIdentityTabs = [
		{
			name: 'properties',
			title: TextUtils.i18n('%MODULENAME%/LABEL_PROPERTIES_TAB'),
			view: new CIdentitySettingsFormView(this),
			visible: ko.observable(true)
		},
		{
			name: 'signature',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SIGNATURE_TAB'),
			view: SignatureSettingsFormView,
			visible: ko.observable(true)
		}
	];

	this.aFetcherTabs = [
		{
			name: 'incoming',
			title: TextUtils.i18n('%MODULENAME%/LABEL_POP3_SETTINGS_TAB'),
			view: new CFetcherIncomingSettingsFormView(this),
			visible: ko.observable(true)
		},
		{
			name: 'outgoing',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SMTP_SETTINGS_TAB'),
			view: FetcherOutgoingSettingsFormView,
			visible: ko.observable(true)
		},
		{
			name: 'signature',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SIGNATURE_TAB'),
			view: SignatureSettingsFormView,
			visible: ko.observable(true)
		}
	];

	this.aAliasTabs = [
		{
			name: 'properties',
			title: TextUtils.i18n('%MODULENAME%/LABEL_PROPERTIES_TAB'),
			view: new CAliasSettingsFormView(this, this.bAllowAliases),
			visible: ko.observable(true)
		},
		{
			name: 'signature',
			title: TextUtils.i18n('%MODULENAME%/LABEL_SIGNATURE_TAB'),
			view: SignatureSettingsFormView,
			visible: ko.observable(true)
		}
	];

	this.currentTab = ko.observable(null);
	this.tabs = ko.computed(function () {
		if (this.editedIdentity())
		{
			return this.aIdentityTabs;
		}
		if (this.editedFetcher())
		{
			return this.aFetcherTabs;
		}
		if (this.editedAlias())
		{
			return this.aAliasTabs;
		}
		return this.aAccountTabs;
	}, this);

	AccountList.editedId.subscribe(function () {
		this.populate();
	}, this);
}

CAccountsSettingsPaneView.prototype.ViewTemplate = '%ModuleName%_Settings_AccountsSettingsPaneView';

/**
 * Checks if there are changes in accounts settings pane.
 * @returns {Boolean}
 */
CAccountsSettingsPaneView.prototype.hasUnsavedChanges = function ()
{
	var oCurrentTab = this.currentTab();
	return oCurrentTab && oCurrentTab.view && _.isFunction(oCurrentTab.view.hasUnsavedChanges) && oCurrentTab.view.hasUnsavedChanges();
};

/**
 * Reverts all changes in accounts settings pane.
 */
CAccountsSettingsPaneView.prototype.revert = function ()
{
	var oCurrentTab = this.currentTab();
	if (oCurrentTab && oCurrentTab.view && _.isFunction(oCurrentTab.view.revert))
	{
		oCurrentTab.view.revert();
	}
};

/**
 * @param {Function} fAfterHideHandler
 * @param {Function} fRevertRouting
 */
CAccountsSettingsPaneView.prototype.hide = function (fAfterHideHandler, fRevertRouting)
{
	if (this.currentTab() && _.isFunction(this.currentTab().view.hide))
	{
		this.currentTab().view.hide(fAfterHideHandler, fRevertRouting);
	}
	else
	{
		fAfterHideHandler();
	}
};

/**
 * @param {Array} aParams
 */
CAccountsSettingsPaneView.prototype.showTab = function (aParams)
{
	var
		sType = aParams.length > 0 ? aParams[0] : 'account',
		oEditedAccount = AccountList.getEdited(),
		sHash = aParams.length > 1 ? aParams[1] : (oEditedAccount ? oEditedAccount.hash() : ''),
		sTab = aParams.length > 2 ? aParams[2] : ''
	;

	this.editedIdentity(sType === 'identity' ? (AccountList.getIdentityByHash(sHash) || null) : null);
	this.editedFetcher(sType === 'fetcher' ? (AccountList.getFetcherByHash(sHash) || null) : null);
	this.editedAlias(sType === 'alias' ? (AccountList.getAliasByHash(sHash) || null) : null);

	if (sType === 'account')
	{
		if (aParams[1] === 'create' && !AccountList.hasAccount())
		{
			this.addAccount();
			Screens.showError(TextUtils.i18n('%MODULENAME%/INFO_SPECIFY_CREDENTIALS'));
			Routing.replaceHashDirectly(['settings', 'mail-accounts']);
		}
		else if (sHash !== '')
		{
			if (oEditedAccount && oEditedAccount.hash() === sHash)
			{
				this.populate();
			}
			else
			{
				if (_.find(AccountList.collection(), function (oAccount) {
					return oAccount.hash() === sHash;
				}))
				{
					AccountList.changeEditedAccountByHash(sHash);
				}
				else
				{
					Routing.replaceHash(['settings', 'mail-accounts']);
				}
			}
		}
	}

	this.changeTab(sTab || this.getAutoselectedTab().name);
};

CAccountsSettingsPaneView.prototype.getAutoselectedTab = function ()
{
	var oCurrentTab = _.find(this.tabs(), function (oTab) {
		return oTab.visible();
	});

	if (!oCurrentTab)
	{
		oCurrentTab = this.tabs()[0];
	}

	return oCurrentTab;
};

CAccountsSettingsPaneView.prototype.addAccount = function ()
{
	var iTenantId = _.isFunction(App.getTenantId) ? App.getTenantId() : null;
	if (iTenantId !== null)
	{
		Ajax.send('GetServers', {
			'TenantId': iTenantId
		}, function (oResponse) {
			var aOAuthOptions = [];
			if (_.isArray(oResponse && oResponse.Result && oResponse.Result.Items))
			{
				_.each(oResponse.Result.Items, function (oServerData) {
					var oServer = new CServerModel(oServerData);
					if (oServer.bOauthEnable)
					{
						aOAuthOptions.push({
							'Name': oServer.sOauthName,
							'Type': oServer.sOauthType,
							'IconUrl': oServer.sOauthIconUrl
						});
					}
				});

				if (aOAuthOptions.length > 0)
				{
					aOAuthOptions.push({
						'Name': 'Other',
						'Type': '',
						'IconUrl': 'static/styles/images/modules/%ModuleName%/logo_other.png'
					});
				}
			}
			this.openCreateAccountShortFormPopup(aOAuthOptions);
		}, this);
	}
	else
	{
		this.openCreateAccountShortFormPopup([]);
	}
};

CAccountsSettingsPaneView.prototype.openCreateAccountShortFormPopup = function (aOAuthOptions)
{
	Popups.showPopup(CreateAccountShortFormPopup, [aOAuthOptions, _.bind(function (iAccountId) {
		var oAccount = AccountList.getAccount(iAccountId);
		if (oAccount)
		{
			this.editAccount(oAccount.hash());
		}
	}, this)]);
};

/**
 * @param {string} sHash
 */
CAccountsSettingsPaneView.prototype.editAccount = function (sHash)
{
	ModulesManager.run('SettingsWebclient', 'setAddHash', [['account', sHash]]);
};

/**
 * @param {number} iAccountId
 * @param {Object} oEv
 */
CAccountsSettingsPaneView.prototype.addIdentity = function (iAccountId, oEv)
{
	oEv.stopPropagation();
	Popups.showPopup(CreateIdentityPopup, [iAccountId]);
};

/**
 * @param {string} sHash
 */
CAccountsSettingsPaneView.prototype.editIdentity = function (sHash)
{
	ModulesManager.run('SettingsWebclient', 'setAddHash', [['identity', sHash]]);
};

/**
 * @param {number} iAccountId
 * @param {Object} oEv
 */
CAccountsSettingsPaneView.prototype.addFetcher = function (iAccountId, oEv)
{
	oEv.stopPropagation();
	Popups.showPopup(CreateFetcherPopup, [iAccountId]);
};

/**
 * @param {string} sHash
 */
CAccountsSettingsPaneView.prototype.editFetcher = function (sHash)
{
	ModulesManager.run('SettingsWebclient', 'setAddHash', [['fetcher', sHash]]);
};

/**
 * @param {number} iAccountId
 * @param {Object} oEv
 */
CAccountsSettingsPaneView.prototype.addAlias = function (iAccountId, oEv)
{
	oEv.stopPropagation();
	Popups.showPopup(CreateAliasPopup, [iAccountId]);
};

/**
 * @param {string} sHash
 */
CAccountsSettingsPaneView.prototype.editAlias = function (sHash)
{
	ModulesManager.run('SettingsWebclient', 'setAddHash', [['alias', sHash]]);
};

/**
 * @param {string} sTabName
 */
CAccountsSettingsPaneView.prototype.changeRoute = function (sTabName)
{
	var
		oEditedAccount = AccountList.getEdited(),
		aAddHash = ['account', oEditedAccount ? oEditedAccount.hash() : '', sTabName]
	;
	if (this.editedIdentity())
	{
		aAddHash = ['identity', this.editedIdentity().hash(), sTabName];
	}
	else if (this.editedFetcher())
	{
		aAddHash = ['fetcher', this.editedFetcher().hash(), sTabName];
	}
	else if (this.editedAlias())
	{
		aAddHash = ['alias', this.editedAlias().hash(), sTabName];
	}
	ModulesManager.run('SettingsWebclient', 'setAddHash', [aAddHash]);
};

/**
 * @param {string} sName
 */
CAccountsSettingsPaneView.prototype.changeTab = function (sName)
{
	var
		oCurrentTab = this.currentTab(),
		oNewTab = _.find(this.tabs(), function (oTab) {
			return oTab.visible() && oTab.name === sName;
		}),
		fShowNewTab = function () {
			if (oNewTab)
			{
				if (_.isFunction(oNewTab.view.showTab))
				{
					oNewTab.view.showTab(this.editedIdentity() || this.editedFetcher() || this.editedAlias());
				}
				this.currentTab(oNewTab);
			}
		}.bind(this),
		bShow = true
	;

	if (oNewTab)
	{
		if (oCurrentTab && _.isFunction(oCurrentTab.view.hide))
		{
			oCurrentTab.view.hide(fShowNewTab, _.bind(function () {
				if (_.isFunction(Routing.stopListening) && _.isFunction(Routing.startListening))
				{
					Routing.stopListening();
				}
				this.changeRoute(oCurrentTab.name);
				if (_.isFunction(Routing.startListening))
				{
					Routing.startListening();
				}
			}, this));
			bShow = false;
		}
	}
	else if (!oCurrentTab)
	{
		oNewTab = this.getAutoselectedTab();
	}

	if (!oCurrentTab)
	{
		_.delay(_.bind(function () {
			this.changeRoute(oNewTab.name);
		}, this));
	}

	if (bShow)
	{
		fShowNewTab();
	}
};

CAccountsSettingsPaneView.prototype.populate = function ()
{
	var oAccount = AccountList.getEdited();

	if (oAccount)
	{
		this.allowFolders(oAccount.allowManageFolders());
		this.allowForward(oAccount.allowForward());
		this.allowAutoresponder(oAccount.allowAutoresponder());
		this.allowFilters(oAccount.allowFilters());
		this.allowSignature(!Settings.AllowIdentities);
		this.visibleAllowBlockLists(oAccount.enableAllowBlockLists());

		if (!this.currentTab() || !this.currentTab().visible())
		{
			this.currentTab(this.getAutoselectedTab());
		}
	}
};

CAccountsSettingsPaneView.prototype.onRemoveIdentity = function ()
{
	this.editedIdentity(null);
	this.changeTab(this.currentTab() ? this.currentTab().name : '');
};

CAccountsSettingsPaneView.prototype.onRemoveFetcher = function ()
{
	this.editedFetcher(null);
	this.changeRoute('');
};

CAccountsSettingsPaneView.prototype.onRemoveAlias = function ()
{
	this.editedAlias(null);
	this.changeRoute('');
};

module.exports = new CAccountsSettingsPaneView();
