'use strict';

function AddQuotaSettingsView(Settings, ModulesManager, TextUtils)
{
	if (Settings.AllowChangeMailQuotaOnMailServer)
	{
		ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
			function(resolve) {
				require.ensure(
					['modules/%ModuleName%/js/views/settings/MailQuotaAdminSettingsFormView.js'],
					function() {
						resolve(require('modules/%ModuleName%/js/views/settings/MailQuotaAdminSettingsFormView.js'));
					},
					'admin-bundle'
				);
			},
			Settings.HashModuleName + '-quota',
			TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
		]);
	}
}

module.exports = function (oAppData) {
	require('modules/%ModuleName%/js/enums.js');

	var
		_ = require('underscore'),
		ko = require('knockout'),

		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

		App = require('%PathToCoreWebclientModule%/js/App.js'),
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),

		Settings = require('modules/%ModuleName%/js/Settings.js'),

		bAdminUser = App.getUserRole() === Enums.UserRole.SuperAdmin,

		AccountList = null,
		ComposeView = null,

		HeaderItemView = null
	;

	Settings.init(oAppData);

	if (!ModulesManager.isModuleAvailable(Settings.ServerModuleName))
	{
		return null;
	}

	AccountList = require('modules/MailWebclient/js/AccountList.js');

	if (bAdminUser)
	{
		return {
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/settings/ServersAdminSettingsPaneView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/settings/ServersAdminSettingsPaneView.js'));
							},
							'admin-bundle'
						);
					},
					Settings.HashModuleName + '-servers',
					TextUtils.i18n('%MODULENAME%/LABEL_SERVERS_SETTINGS_TAB')
				]);
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function(resolve) {
						require.ensure(
							['modules/%ModuleName%/js/views/settings/MailAdminSettingsFormView.js'],
							function() {
								resolve(require('modules/%ModuleName%/js/views/settings/MailAdminSettingsFormView.js'));
							},
							'admin-bundle'
						);
					},
					Settings.HashModuleName,
					TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
				]);
				AddQuotaSettingsView(Settings, ModulesManager, TextUtils);
			},
			getAccountList: function () {
				return AccountList;
			},
			disableEditDomainsInServer: function () {
				Settings.disableEditDomainsInServer();
			}
		};
	}
	else if (App.isUserNormalOrTenant())
	{
		var Cache = require('modules/%ModuleName%/js/Cache.js');
		Cache.init();

		if (App.isNewTab())
		{
			var GetComposeView = function() {
				if (ComposeView === null)
				{
					var CComposeView = require('modules/%ModuleName%/js/views/CComposeView.js');
					ComposeView = new CComposeView();
				}
				return ComposeView;
			};

			return {
				start: function () {
					require('modules/%ModuleName%/js/koBindings.js');
				},
				getScreens: function () {
					var oScreens = {};
					oScreens[Settings.HashModuleName + '-view'] = function () {
						return require('modules/%ModuleName%/js/views/MessagePaneView.js');
					};
					oScreens[Settings.HashModuleName + '-compose'] = function () {
						return GetComposeView();
					};
					return oScreens;
				},
				registerComposeToolbarController: function (oController) {
					var ComposeView = GetComposeView();
					ComposeView.registerToolbarController(oController);
				},
				registerComposeMessageRowController: function (oController) {
					var ComposeView = GetComposeView();
					ComposeView.registerMessageRowController(oController);
				},
				getComposeMessageWithData: function () {
					var
						bAllowSendMail = true,
						ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js')
					;
					return bAllowSendMail ? ComposeUtils.composeMessageWithData : false;
				},
				getComposeMessageToAddresses: function () {
					var
						bAllowSendMail = true,
						ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js')
					;
					return bAllowSendMail ? ComposeUtils.composeMessageToAddresses : false;
				},
				getComposeMessageWithAttachments: function () {
					var
						bAllowSendMail = true,
						ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js')
					;
					return bAllowSendMail ? ComposeUtils.composeMessageWithAttachments : false;
				},
				getSearchMessagesInCurrentFolder: function () {
					var MainTab = window.opener && window.opener.MainTabMailMethods;
					return MainTab ? _.bind(MainTab.searchMessagesInCurrentFolder, MainTab) : false;
				},
				getCurrentMessage: function () {
					return Cache.currentMessage();
				},
				getCurrentFolderList: function () {
					return Cache.folderList();
				},
				syncFolders: function () {
					return Cache.getFolderList(Cache.currentAccountId());
				},
				removeMessageFromCurrentList: function (iAccountId, sFolder, sUid) {
					return Cache.removeMessageFromCurrentList(iAccountId, sFolder, sUid);
				}
			};
		}
		else
		{
			var oMethods = {
				enableModule: ko.observable(Settings.AllowAddAccounts || AccountList.hasAccount() ),
				getComposeMessageToAddresses: function () {
					var
						bAllowSendMail = true,
						ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js')
					;
					return bAllowSendMail ? ComposeUtils.composeMessageToAddresses : false;
				},
				getComposeMessageWithData: function () {
					var
						bAllowSendMail = true,
						ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js')
					;
					return bAllowSendMail ? ComposeUtils.composeMessageWithData : false;
				},
				getComposeMessageWithAttachments: function () {
					var
						bAllowSendMail = true,
						ComposeUtils = require('modules/%ModuleName%/js/utils/Compose.js')
					;
					return bAllowSendMail ? ComposeUtils.composeMessageWithAttachments : false;
				},
				getPrefetcher: function () {
					return require('modules/%ModuleName%/js/Prefetcher.js');
				},
				registerComposeToolbarController: function (oController) {
					var ComposePopup = require('modules/%ModuleName%/js/popups/ComposePopup.js');
					ComposePopup.registerToolbarController(oController);
				},
				registerComposeMessageRowController: function (oController) {
					var ComposePopup = require('modules/%ModuleName%/js/popups/ComposePopup.js');
					ComposePopup.registerMessageRowController(oController);
				},
				getSearchMessagesInInbox: function () {
					return _.bind(Cache.searchMessagesInInbox, Cache);
				},
				getFolderHash: function (sFolder) {
					return Cache.getFolderHash(sFolder);
				},
				getSearchMessagesInCurrentFolder: function () {
					return _.bind(Cache.searchMessagesInCurrentFolder, Cache);
				},
				getMessage: function (sFullName, sUid, fResponseHandler) {
					return Cache.getMessage(Cache.currentAccountId(), sFullName, sUid, fResponseHandler, Cache);
				},
				getCurrentMessage: function () {
					return Cache.currentMessage();
				},
				getCurrentFolderList: function () {
					return Cache.folderList();
				},
				syncFolders: function () {
					return Cache.getFolderList(Cache.currentAccountId());
				},
				removeMessageFromCurrentList: function (iAccountId, sFolder, sUid) {
					return Cache.removeMessageFromCurrentList(iAccountId, sFolder, sUid);
				},
				deleteMessages: function (iAccountId, sFolderFullName, aUids) {
					var oFolder = Cache.getFolderByFullName(iAccountId, sFolderFullName);
					Cache.deleteMessagesFromFolder(oFolder, aUids);
				},
				getAllAccountsFullEmails: function () {
					return AccountList.getAllFullEmails();
				},
				getAccountList: function () {
					return AccountList;
				},
				setCustomRouting: function (sFolder, iPage, sUid, sSearch, sFilters, sCustom) {
					var
						Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
						LinksUtils = require('modules/%ModuleName%/js/utils/Links.js')
					;
					Routing.setHash(LinksUtils.getMailbox(sFolder, iPage, sUid, sSearch, sFilters, Settings.MessagesSortBy.DefaultSortBy, Settings.MessagesSortBy.DefaultSortOrder, sCustom));
				}
			};

			if (!App.isMobile())
			{
				oMethods = _.extend(oMethods, {
					start: function (ModulesManager) {
						var
							TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
							Browser = require('%PathToCoreWebclientModule%/js/Browser.js'),
							MailUtils = require('modules/%ModuleName%/js/utils/Mail.js')
						;

						require('modules/%ModuleName%/js/koBindings.js');
						require('modules/%ModuleName%/js/koBindingSearchHighlighter.js');

						if (Settings.AllowAppRegisterMailto)
						{
							MailUtils.registerMailto(Browser.firefox);
						}

						if (Settings.AllowAddAccounts || AccountList.hasAccount())
						{
							ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
								function () {
									return require('modules/%ModuleName%/js/views/settings/MailSettingsFormView.js');
								},
								Settings.HashModuleName,
								TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')
							]);

							var sTabName = Settings.AllowMultiAccounts ? TextUtils.i18n('%MODULENAME%/LABEL_ACCOUNTS_SETTINGS_TAB') : TextUtils.i18n('%MODULENAME%/LABEL_ACCOUNT_SETTINGS_TAB');
							ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
								function () {
									return require('modules/%ModuleName%/js/views/settings/AccountsSettingsPaneView.js');
								},
								Settings.HashModuleName + '-accounts',
								sTabName
							]);
						}

						ko.computed(function () {
							var
								aAuthAcconts = _.filter(AccountList.collection(), function (oAccount) {
									return oAccount.useToAuthorize();
								}),
								aAuthAccountsEmails = _.map(aAuthAcconts, function (oAccount) {
									return oAccount.email();
								})
							;
							Settings.userMailAccountsCount(aAuthAcconts.length);
							Settings.mailAccountsEmails(aAuthAccountsEmails);
						}, this);

						if (App.getUserRole() === Enums.UserRole.TenantAdmin)
						{
							AddQuotaSettingsView(Settings, ModulesManager, TextUtils);
						}
					},
					getScreens: function () {
						var oScreens = {};
						oScreens[Settings.HashModuleName] = function () {
							var CMailView = require('modules/%ModuleName%/js/views/CMailView.js');
							return new CMailView();
						};
						return oScreens;
					},
					getHeaderItem: function () {
						if (HeaderItemView === null)
						{
							HeaderItemView = require('modules/%ModuleName%/js/views/HeaderItemView.js');
						}

						return {
							item: HeaderItemView,
							name: Settings.HashModuleName
						};
					},
					getMobileSyncSettingsView: function () {
						return require('modules/%ModuleName%/js/views/DefaultAccountHostsSettingsView.js');
					}
				});
			}

			return oMethods;
		}
	}

	return null;
};
