'use strict';
var $ = require('jquery'), _ = require('underscore'), Promise = require('bluebird');
$('body').ready(function () {
	var oAvailableModules = {};
	if (window.aAvailableModules) {
		if (window.aAvailableModules.indexOf('AdminPanelWebclient') >= 0) {
			oAvailableModules['AdminPanelWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/AdminPanelWebclient/js/manager.js'); resolve(oModule); }, 'AdminPanelWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('ChangePasswordWebclient') >= 0) {
			oAvailableModules['ChangePasswordWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/ChangePasswordWebclient/js/manager.js'); resolve(oModule); }, 'ChangePasswordWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('ContactsWebclient') >= 0) {
			oAvailableModules['ContactsWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/ContactsWebclient/js/manager.js'); resolve(oModule); }, 'ContactsWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('Dropbox') >= 0) {
			oAvailableModules['Dropbox'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/Dropbox/js/manager.js'); resolve(oModule); }, 'Dropbox');
			});
		}
		if (window.aAvailableModules.indexOf('Facebook') >= 0) {
			oAvailableModules['Facebook'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/Facebook/js/manager.js'); resolve(oModule); }, 'Facebook');
			});
		}
		if (window.aAvailableModules.indexOf('Google') >= 0) {
			oAvailableModules['Google'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/Google/js/manager.js'); resolve(oModule); }, 'Google');
			});
		}
		if (window.aAvailableModules.indexOf('LogsViewerWebclient') >= 0) {
			oAvailableModules['LogsViewerWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/LogsViewerWebclient/js/manager.js'); resolve(oModule); }, 'LogsViewerWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('MailChangePasswordPoppassdPlugin') >= 0) {
			oAvailableModules['MailChangePasswordPoppassdPlugin'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/MailChangePasswordPoppassdPlugin/js/manager.js'); resolve(oModule); }, 'MailChangePasswordPoppassdPlugin');
			});
		}
		if (window.aAvailableModules.indexOf('MailNotesPlugin') >= 0) {
			oAvailableModules['MailNotesPlugin'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/MailNotesPlugin/js/manager.js'); resolve(oModule); }, 'MailNotesPlugin');
			});
		}
		if (window.aAvailableModules.indexOf('MailSaveMessageAsPdfPlugin') >= 0) {
			oAvailableModules['MailSaveMessageAsPdfPlugin'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/MailSaveMessageAsPdfPlugin/js/manager.js'); resolve(oModule); }, 'MailSaveMessageAsPdfPlugin');
			});
		}
		if (window.aAvailableModules.indexOf('MailSensitivityWebclientPlugin') >= 0) {
			oAvailableModules['MailSensitivityWebclientPlugin'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/MailSensitivityWebclientPlugin/js/manager.js'); resolve(oModule); }, 'MailSensitivityWebclientPlugin');
			});
		}
		if (window.aAvailableModules.indexOf('MailTnefWebclientPlugin') >= 0) {
			oAvailableModules['MailTnefWebclientPlugin'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/MailTnefWebclientPlugin/js/manager.js'); resolve(oModule); }, 'MailTnefWebclientPlugin');
			});
		}
		if (window.aAvailableModules.indexOf('MailWebclient') >= 0) {
			oAvailableModules['MailWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/MailWebclient/js/manager.js'); resolve(oModule); }, 'MailWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('MailZipWebclientPlugin') >= 0) {
			oAvailableModules['MailZipWebclientPlugin'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/MailZipWebclientPlugin/js/manager.js'); resolve(oModule); }, 'MailZipWebclientPlugin');
			});
		}
		if (window.aAvailableModules.indexOf('OAuthIntegratorWebclient') >= 0) {
			oAvailableModules['OAuthIntegratorWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/OAuthIntegratorWebclient/js/manager.js'); resolve(oModule); }, 'OAuthIntegratorWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('OfficeDocumentViewer') >= 0) {
			oAvailableModules['OfficeDocumentViewer'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/OfficeDocumentViewer/js/manager.js'); resolve(oModule); }, 'OfficeDocumentViewer');
			});
		}
		if (window.aAvailableModules.indexOf('OpenPgpWebclient') >= 0) {
			oAvailableModules['OpenPgpWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/OpenPgpWebclient/js/manager.js'); resolve(oModule); }, 'OpenPgpWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('SessionTimeoutWebclient') >= 0) {
			oAvailableModules['SessionTimeoutWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/SessionTimeoutWebclient/js/manager.js'); resolve(oModule); }, 'SessionTimeoutWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('SettingsWebclient') >= 0) {
			oAvailableModules['SettingsWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/SettingsWebclient/js/manager.js'); resolve(oModule); }, 'SettingsWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('StandardLoginFormWebclient') >= 0) {
			oAvailableModules['StandardLoginFormWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/StandardLoginFormWebclient/js/manager.js'); resolve(oModule); }, 'StandardLoginFormWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('StandardRegisterFormWebclient') >= 0) {
			oAvailableModules['StandardRegisterFormWebclient'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/StandardRegisterFormWebclient/js/manager.js'); resolve(oModule); }, 'StandardRegisterFormWebclient');
			});
		}
		if (window.aAvailableModules.indexOf('TwoFactorAuth') >= 0) {
			oAvailableModules['TwoFactorAuth'] = new Promise(function(resolve, reject) {
				require.ensure([], function(require) {var oModule = require('modules/TwoFactorAuth/js/manager.js'); resolve(oModule); }, 'TwoFactorAuth');
			});
		}
	}
	Promise.all(_.values(oAvailableModules)).then(function(aModules){
	var
		ModulesManager = require('modules/CoreWebclient/js/ModulesManager.js'),
		App = require('modules/CoreWebclient/js/App.js'),
		bSwitchingToMobile = App.checkMobile()
	;
	if (!bSwitchingToMobile)
	{
		if (window.isPublic) {
			App.setPublic();
		}
		if (window.isNewTab) {
			App.setNewTab();
		}
		ModulesManager.init(_.object(_.keys(oAvailableModules), aModules));
		App.init();
	}
	});
});
