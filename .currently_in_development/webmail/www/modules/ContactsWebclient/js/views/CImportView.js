'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CJua = require('%PathToCoreWebclientModule%/js/CJua.js'),
	UserSettings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @param {CContactsViewModel} oParent
 * @constructor
 */
function CImportView(oParent)
{
	this.oJua = null;
	this.oParent = oParent;

	this.visibility = ko.observable(false);
	this.importing = ko.observable(false);
	
	this.importButtonDom = ko.observable(null);
	
	this.bVisibleCloseButton = App.isMobile();
	
	this.extensionInfo = oParent.getFormatDependentText('INFO_IMPORT_CONTACTS');
}

CImportView.prototype.ViewTemplate = '%ModuleName%_ImportView';

CImportView.prototype.onBind = function ()
{
	var aFormats = _.map(Settings.ImportExportFormats, function (sFormat) {
		return '.' + sFormat;
	});
	this.oJua = new CJua({
		'action': '?/Api/',
		'name': 'jua-uploader',
		'queueSize': 1,
		'clickElement': this.importButtonDom(),
		'hiddenElementsPosition': UserSettings.IsRTL ? 'right' : 'left',
		'disableAjaxUpload': false,
		'disableDragAndDrop': true,
		'disableMultiple': true,
		'hidden': _.extendOwn({
			'Module': Settings.ServerModuleName,
			'Method': 'Import',
			'Parameters':  _.bind(function () {
				return JSON.stringify({
					'GroupUUID': this.oParent.currentGroupUUID(),
					'Storage': 'personal'
				});
			}, this)
		}, App.getCommonRequestParameters()),
		accept: aFormats.join(',')
	});

	this.oJua
		.on('onSelect', _.bind(this.oParent.onImportSelect, this.oParent))
		.on('onStart', _.bind(this.onFileUploadStart, this))
		.on('onComplete', _.bind(this.onFileUploadComplete, this))
	;
};

CImportView.prototype.onFileUploadStart = function ()
{
	this.importing(true);
};

/**
 * @param {string} sFileUid
 * @param {boolean} bResponseReceived
 * @param {Object} oResponse
 */
CImportView.prototype.onFileUploadComplete = function (sFileUid, bResponseReceived, oResponse)
{
	this.importing(false);
	this.oParent.onImportComplete(sFileUid, bResponseReceived, oResponse);
};

module.exports = CImportView;
