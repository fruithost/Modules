'use strict';

function IsPgpSupported()
{
	return !!(window.crypto && window.crypto.getRandomValues);
}

module.exports = function (oAppData) {
	var
		Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
		Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
		ImportKeyPopup = require('modules/%ModuleName%/js/popups/ImportKeyPopup.js')
	;
	
	if (App.getUserRole() === Enums.UserRole.NormalUser)
	{
		var
			_ = require('underscore'),

			TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

			Settings = require('modules/%ModuleName%/js/Settings.js')
		;

		Settings.init(oAppData);

		return {
			start: function (ModulesManager) {
				if (IsPgpSupported())
				{
					App.subscribeEvent('MailWebclient::RegisterMessagePaneController', function (fRegisterMessagePaneController) {
						fRegisterMessagePaneController(require('modules/%ModuleName%/js/views/MessageControlsView.js'), 'BeforeMessageHeaders');
					});
					if (App.isMobile())
					{
						ModulesManager.run('MailMobileWebclient', 'registerComposeToolbarController', [require('modules/%ModuleName%/js/views/ComposeButtonsView.js')]);
					}
					else
					{
						ModulesManager.run('MailWebclient', 'registerComposeToolbarController', [require('modules/%ModuleName%/js/views/ComposeButtonsView.js')]);
					}
					ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [function () { return require('modules/%ModuleName%/js/views/OpenPgpSettingsFormView.js'); }, Settings.HashModuleName, TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')]);
					
					App.subscribeEvent('MailWebclient::ParseFile::after', function (oFile) {
						if (oFile && _.isFunction(oFile.addAction) && Utils.getFileExtension(oFile.fileName()) === 'asc' && oFile.content && oFile.content())
						{
							var oActionData = {
								'Text': TextUtils.i18n('%MODULENAME%/ACTION_FILE_IMPORT_KEY'),
								'Handler': function () { Popups.showPopup(ImportKeyPopup, [oFile.content()]); }
							};
							oFile.addAction('import', true, oActionData);
							oFile.removeAction('view');
						}
					});
					
					App.subscribeEvent('FilesWebclient::ParseFile::after', function (aParams) {
						var
							oFile = aParams[0]
						;
						if (oFile && _.isFunction(oFile.addAction) && Utils.getFileExtension(oFile.fileName()) === 'asc' && oFile.content && oFile.content())
						{
							var oActionData = {
								'Text': TextUtils.i18n('%MODULENAME%/ACTION_FILE_IMPORT_KEY'),
								'Handler': function () { Popups.showPopup(ImportKeyPopup, [oFile.content()]); }
							};
							oFile.addAction('import', true, oActionData);
						}
					});
				}
			}
		};
	}
	
	return null;
};
