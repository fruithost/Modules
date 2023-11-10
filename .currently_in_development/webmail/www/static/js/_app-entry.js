'use strict';
import Promise from 'bluebird';
Promise.config({
	warnings: {
		wForgottenReturn: false
	}
});
if (!window.Promise) { window.Promise = Promise; }
import $ from 'jquery';
import _ from 'underscore';
import "core-js";
import "regenerator-runtime/runtime";

$('body').ready(function () {
	var oAvailableModules = {};
	if (window.aAvailableModules) {

		if (window.aAvailableModules.indexOf('AdminPanelWebclient') >= 0) {
			oAvailableModules['AdminPanelWebclient'] = import(/* webpackChunkName: "AdminPanelWebclient" */ 'modules/AdminPanelWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('ChangePasswordWebclient') >= 0) {
			oAvailableModules['ChangePasswordWebclient'] = import(/* webpackChunkName: "ChangePasswordWebclient" */ 'modules/ChangePasswordWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('ContactsWebclient') >= 0) {
			oAvailableModules['ContactsWebclient'] = import(/* webpackChunkName: "ContactsWebclient" */ 'modules/ContactsWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('CpanelIntegrator') >= 0) {
			oAvailableModules['CpanelIntegrator'] = import(/* webpackChunkName: "CpanelIntegrator" */ 'modules/CpanelIntegrator/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('Dropbox') >= 0) {
			oAvailableModules['Dropbox'] = import(/* webpackChunkName: "Dropbox" */ 'modules/Dropbox/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('Facebook') >= 0) {
			oAvailableModules['Facebook'] = import(/* webpackChunkName: "Facebook" */ 'modules/Facebook/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('Google') >= 0) {
			oAvailableModules['Google'] = import(/* webpackChunkName: "Google" */ 'modules/Google/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('ImportExportMailPlugin') >= 0) {
			oAvailableModules['ImportExportMailPlugin'] = import(/* webpackChunkName: "ImportExportMailPlugin" */ 'modules/ImportExportMailPlugin/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('LogsViewerWebclient') >= 0) {
			oAvailableModules['LogsViewerWebclient'] = import(/* webpackChunkName: "LogsViewerWebclient" */ 'modules/LogsViewerWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailChangePasswordPoppassdPlugin') >= 0) {
			oAvailableModules['MailChangePasswordPoppassdPlugin'] = import(/* webpackChunkName: "MailChangePasswordPoppassdPlugin" */ 'modules/MailChangePasswordPoppassdPlugin/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailLoginFormWebclient') >= 0) {
			oAvailableModules['MailLoginFormWebclient'] = import(/* webpackChunkName: "MailLoginFormWebclient" */ 'modules/MailLoginFormWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailMasterPassword') >= 0) {
			oAvailableModules['MailMasterPassword'] = import(/* webpackChunkName: "MailMasterPassword" */ 'modules/MailMasterPassword/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailNotesPlugin') >= 0) {
			oAvailableModules['MailNotesPlugin'] = import(/* webpackChunkName: "MailNotesPlugin" */ 'modules/MailNotesPlugin/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailSaveMessageAsPdfPlugin') >= 0) {
			oAvailableModules['MailSaveMessageAsPdfPlugin'] = import(/* webpackChunkName: "MailSaveMessageAsPdfPlugin" */ 'modules/MailSaveMessageAsPdfPlugin/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailSensitivityWebclientPlugin') >= 0) {
			oAvailableModules['MailSensitivityWebclientPlugin'] = import(/* webpackChunkName: "MailSensitivityWebclientPlugin" */ 'modules/MailSensitivityWebclientPlugin/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailTnefWebclientPlugin') >= 0) {
			oAvailableModules['MailTnefWebclientPlugin'] = import(/* webpackChunkName: "MailTnefWebclientPlugin" */ 'modules/MailTnefWebclientPlugin/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailWebclient') >= 0) {
			oAvailableModules['MailWebclient'] = import(/* webpackChunkName: "MailWebclient" */ 'modules/MailWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('MailZipWebclientPlugin') >= 0) {
			oAvailableModules['MailZipWebclientPlugin'] = import(/* webpackChunkName: "MailZipWebclientPlugin" */ 'modules/MailZipWebclientPlugin/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('OAuthIntegratorWebclient') >= 0) {
			oAvailableModules['OAuthIntegratorWebclient'] = import(/* webpackChunkName: "OAuthIntegratorWebclient" */ 'modules/OAuthIntegratorWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('OfficeDocumentViewer') >= 0) {
			oAvailableModules['OfficeDocumentViewer'] = import(/* webpackChunkName: "OfficeDocumentViewer" */ 'modules/OfficeDocumentViewer/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('OpenPgpWebclient') >= 0) {
			oAvailableModules['OpenPgpWebclient'] = import(/* webpackChunkName: "OpenPgpWebclient" */ 'modules/OpenPgpWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('RecaptchaWebclientPlugin') >= 0) {
			oAvailableModules['RecaptchaWebclientPlugin'] = import(/* webpackChunkName: "RecaptchaWebclientPlugin" */ 'modules/RecaptchaWebclientPlugin/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('SessionTimeoutWebclient') >= 0) {
			oAvailableModules['SessionTimeoutWebclient'] = import(/* webpackChunkName: "SessionTimeoutWebclient" */ 'modules/SessionTimeoutWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('SettingsWebclient') >= 0) {
			oAvailableModules['SettingsWebclient'] = import(/* webpackChunkName: "SettingsWebclient" */ 'modules/SettingsWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('StandardLoginFormWebclient') >= 0) {
			oAvailableModules['StandardLoginFormWebclient'] = import(/* webpackChunkName: "StandardLoginFormWebclient" */ 'modules/StandardLoginFormWebclient/js/manager.js').then(function (module) { return module.default});
		}

		if (window.aAvailableModules.indexOf('TwoFactorAuth') >= 0) {
			oAvailableModules['TwoFactorAuth'] = import(/* webpackChunkName: "TwoFactorAuth" */ 'modules/TwoFactorAuth/js/manager.js').then(function (module) { return module.default});
		}
	}
	Promise.all(_.values(oAvailableModules)).then(function(aModules){
		var
			ModulesManager = require('modules/CoreWebclient/js/ModulesManager.js'),
			App = require('modules/CoreWebclient/js/App.js'),
			bSwitchingToMobile = App.checkMobile()
		;
		if (!bSwitchingToMobile) {
			if (window.isPublic) {
				App.setPublic();
			}
			if (window.isNewTab) {
				App.setNewTab();
			}
			ModulesManager.init(_.object(_.keys(oAvailableModules), aModules));
			App.init();
		}
	}).catch(function (oError) { console.error('An error occurred while loading the component:'); console.error(oError); });
});

