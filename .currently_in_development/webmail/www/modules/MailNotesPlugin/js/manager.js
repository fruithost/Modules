'use strict';

module.exports = function (oAppData) {
	var
		_ = require('underscore'),
		ko = require('knockout'),
		
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
				
		App = require('%PathToCoreWebclientModule%/js/App.js'),

		sNotesName = 'Notes',
		sNotesFullName = sNotesName
	;
	
	function SetNotesFolder(koFolderList)
	{
		var
			sNameSpace = koFolderList().sNamespaceFolder,
			sDelimiter = koFolderList().sDelimiter
		;
		if (sNameSpace !== '')
		{
			sNotesFullName = sNameSpace + sDelimiter + sNotesName;
		}
		else
		{
			sNotesFullName = sNotesName;
		}
		var oNotesFolder = koFolderList().getFolderByFullName(sNotesFullName);
		if (oNotesFolder)
		{
			oNotesFolder.displayName = ko.observable(TextUtils.i18n('%MODULENAME%/LABEL_FOLDER_NOTES'));
			oNotesFolder.usedAs = ko.observable(TextUtils.i18n('%MODULENAME%/LABEL_USED_AS_NOTES'));
		}
	}
	
	if (App.isUserNormalOrTenant())
	{
		return {
			start: function (oModulesManager) {
				$('html').addClass('MailNotesPlugin');
				App.subscribeEvent('MailWebclient::ConstructView::before', function (oParams) {
					if (oParams.Name === 'CMailView')
					{
						var
							koFolderList = oParams.MailCache.folderList,
							koCurrentFolder = ko.computed(function () {
								return oParams.MailCache.folderList().currentFolder();
							}),
							CMessagePaneView = require('modules/%ModuleName%/js/views/CMessagePaneView.js'),
							oMessagePane = new CMessagePaneView(oParams.MailCache, _.bind(oParams.View.routeMessageView, oParams.View))
						;
						SetNotesFolder(koFolderList);
						koFolderList.subscribe(function () {
							SetNotesFolder(koFolderList);
						});
						koCurrentFolder.subscribe(function () {
							var sFullName = koCurrentFolder() ? koCurrentFolder().fullName() : '';
							if (sFullName === sNotesFullName)
							{
								oParams.View.setCustomPreviewPane('%ModuleName%', oMessagePane);
								oParams.View.setCustomBigButton('%ModuleName%', function () {
									oModulesManager.run('MailWebclient', 'setCustomRouting', [sFullName, 1, '', '', '', 'create-note']);
								}, TextUtils.i18n('%MODULENAME%/ACTION_NEW_NOTE'));
								oParams.View.resetDisabledTools('%ModuleName%', ['spam', 'move', 'mark']);
							}
							else
							{
								oParams.View.removeCustomPreviewPane('%ModuleName%');
								oParams.View.removeCustomBigButton('%ModuleName%');
								oParams.View.resetDisabledTools('%ModuleName%', []);
							}
						});
					}
				});
				App.subscribeEvent('MailWebclient::ConstructView::after', function (oParams) {
					if (oParams.Name === 'CMessageListView' && oParams.MailCache)
					{
						var
							koCurrentFolder = ko.computed(function () {
								return oParams.MailCache.folderList().currentFolder();
							})
						;
						koCurrentFolder.subscribe(function () {
							var sFullName = koCurrentFolder() ? koCurrentFolder().fullName() : '';
							if (sFullName === sNotesFullName)
							{
								oParams.View.customMessageItemViewTemplate('%ModuleName%_MessageItemView');
							}
							else
							{
								oParams.View.customMessageItemViewTemplate('');
							}
						});
					}
				});
				App.subscribeEvent('MailWebclient::MessageDblClick::before', _.bind(function (oParams) {
					if (oParams.Message && oParams.Message.folder() === sNotesFullName)
					{
						oParams.Cancel = true;
					}
				}, this));
			}
		};
	}
	
	return null;
};
