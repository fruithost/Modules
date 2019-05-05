'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	ErrorsUtils = require('modules/%ModuleName%/js/utils/Errors.js'),
	
	Enums = require('modules/%ModuleName%/js/Enums.js'),
	OpenPgp = require('modules/%ModuleName%/js/OpenPgp.js')
;

/**
 * @constructor
 */
function CGenerateKeyPopup()
{
	CAbstractPopup.call(this);
	
	this.emails = ko.observableArray([]);
	this.selectedEmail = ko.observable('');
	this.password = ko.observable('');
	this.keyLengthOptions = [1024, 2048];
	this.selectedKeyLength = ko.observable(1024);
	this.process = ko.observable(false);
}

_.extendOwn(CGenerateKeyPopup.prototype, CAbstractPopup.prototype);

CGenerateKeyPopup.prototype.PopupTemplate = '%ModuleName%_GenerateKeyPopup';

CGenerateKeyPopup.prototype.onOpen = function ()
{
	this.emails(ModulesManager.run('MailWebclient', 'getAllAccountsFullEmails') || []);
	this.selectedEmail('');
	this.password('');
	this.selectedKeyLength(2048);
	this.process(false);
};

CGenerateKeyPopup.prototype.generate = function ()
{
	var
		fKeysGenerated = _.bind(function () {
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_KEY_SUCCESSFULLY_GENERATED'));
			this.process(false);
			this.closePopup();
		}, this),
		fKeysGenerateError = _.bind(function () {
			ErrorsUtils.showPgpErrorByCode({}, Enums.PgpAction.Generate);
			this.process(false);
			this.closePopup();
		}, this)
	;
	
	this.process(true);
	_.delay(_.bind(function () {
		OpenPgp.generateKey(this.selectedEmail(), $.trim(this.password()), this.selectedKeyLength(), fKeysGenerated, fKeysGenerateError);
	}, this));
};

module.exports = new CGenerateKeyPopup();
