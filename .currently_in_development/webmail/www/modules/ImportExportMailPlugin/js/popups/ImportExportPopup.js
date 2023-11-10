'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CJua = require('%PathToCoreWebclientModule%/js/CJua.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),

	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	MailCache = require('modules/MailWebclient/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function ImportExportPopup()
{
	CAbstractPopup.call(this);

	this.zipFile = ko.observable(null);
	this.status = ko.observable('');
	this.iAutoReloadTimer = -1;
	this.opened = ko.observable(false);
	this.options = ko.observableArray([]);
	this.selectedFolder = ko.observable('');
	this.uploaderButton = ko.observable(null);
	// file uploader
	this.oJua = null;

	this.defaultOptionsAfterRender = Utils.defaultOptionsAfterRender;
	this.exportButtonText = ko.observable(TextUtils.i18n('%MODULENAME%/POPUP_ACTION_EXPORT'));
	this.importButtonText = ko.observable(TextUtils.i18n('%MODULENAME%/POPUP_ACTION_IMPORT'));
	this.processing = ko.computed(function() {
		return (this.status() !== 'ready' && this.status() !== 'error' && this.status() !== '');
	}, this);
	this.status.subscribe(function(bValue) {
		if (bValue === 'ready')
		{
			if (!this.opened())
			{
				this.openPopup({});
			}
			this.exportButtonText(TextUtils.i18n('%MODULENAME%/POPUP_ACTION_DOWNLOAD_ZIP'));
			clearTimeout(this.iAutoReloadTimer);
		}
		else if (bValue === 'error')
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/POPUP_ERROR_GENERATE_ZIP'));
			this.exportButtonText(TextUtils.i18n('%MODULENAME%/POPUP_ACTION_EXPORT'));
			clearTimeout(this.iAutoReloadTimer);
		}
	}, this);
}

_.extendOwn(ImportExportPopup.prototype, CAbstractPopup.prototype);

ImportExportPopup.prototype.PopupTemplate = '%ModuleName%_ImportExportPopup';

ImportExportPopup.prototype.onOpen = function ()
{
	var oFolderList = MailCache.oFolderListItems[MailCache.editedAccountId()];
	this.options(oFolderList ? oFolderList.getOptions('', true, false, false) : []);
};

ImportExportPopup.prototype.onShow = function ()
{
	this.opened(true);
	this.initUploader();
};

ImportExportPopup.prototype.onCancelClick = function ()
{
	this.opened(false);
	this.closeCommand();
};

ImportExportPopup.prototype.exportMail = function ()
{
	if (this.status() === '')
	{
		this.status('prepare');
		Ajax.send(
			Settings.ModuleName,
			'ExportMailPrepare',
			{},
			this.onExportMailResponse,
			this
		);
		this.setAutoReloadTimer();
	}
	else if (this.status() === 'ready')
	{
		this.Download();
	}
};

ImportExportPopup.prototype.setAutoReloadTimer = function ()
{
	var self = this;
	clearTimeout(this.iAutoReloadTimer);

	this.iAutoReloadTimer = setTimeout(function () {
		self.Status();
	}, 10 * 1000);
};

ImportExportPopup.prototype.Status = function ()
{
	this.setAutoReloadTimer();
	if (this.status() !== '')
	{
		Ajax.send(
			Settings.ModuleName,
			'ExportMailStatus',
			{
				'Zip': this.zipFile()
			},
			this.onStatusResponse,
			this
		);
	}
};

ImportExportPopup.prototype.onExportMailResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult && this.status() === 'prepare' && oResult.Zip)
	{
		this.zipFile(oResult.Zip);
		this.exportButtonText(TextUtils.i18n('%MODULENAME%/POPUP_GENERATING_ZIP'));
		Ajax.send(
			Settings.ModuleName,
			'ExportMailGenerate',
			{
				'AccountId': MailCache.editedAccountId(),
				'Folder': this.selectedFolder(),
				'Zip': this.zipFile()
			}
		);
	}
};

ImportExportPopup.prototype.onStatusResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult && oResult.Status)
	{
		this.status(oResult.Status);
	}
};

ImportExportPopup.prototype.Download = function ()
{
	if (this.status() === 'ready')
	{
		this.status('');
		this.exportButtonText(TextUtils.i18n('%MODULENAME%/POPUP_ACTION_EXPORT'));
		window.location.href = '?transfer-mail/export/' + this.zipFile();
	}
};

ImportExportPopup.prototype.initUploader = function ()
{
	var self = this;

	if (this.uploaderButton())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'clickElement': this.uploaderButton(),
			'disableAjaxUpload': false,
			'disableFolderDragAndDrop': true,
			'disableDragAndDrop': true,
			'hidden': _.extendOwn({
				'Module': Settings.ModuleName,
				'Method': 'ImportMail',
				'Parameters':  function () {
					return JSON.stringify({
						'AccountId': MailCache.editedAccountId(),
						'Folder': self.selectedFolder()
					});
				}
			}, App.getCommonRequestParameters())
		});

		this.oJua.bEnableButton = true;
		this.oJua
			.on('onSelect', _.bind(this.onFileUploadSelect, this))
			.on('onStart', _.bind(this.onFileUploadStart, this))
			.on('onComplete', _.bind(this.onFileUploadComplete, this))
		;
	}
};

ImportExportPopup.prototype.onFileUploadSelect = function (sFileUid, oFileData)
{
	if (Settings.UploadSizeLimitMb > 0 && oFileData.Size/(1024*1024) > Settings.UploadSizeLimitMb)
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_SIZE_LIMIT', {'SIZE': Settings.UploadSizeLimitMb}));
		return false;
	}
};

ImportExportPopup.prototype.onFileUploadStart = function ()
{
	this.status('upload');
	this.importButtonText(TextUtils.i18n('%MODULENAME%/POPUP_IMPORTING_ZIP'));
};

ImportExportPopup.prototype.onFileUploadComplete = function (sFileUid, bResponseReceived, oResponse)
{
	var bError = !bResponseReceived || !oResponse || !oResponse.Result || false;

	this.status('');
	this.importButtonText(TextUtils.i18n('%MODULENAME%/POPUP_ACTION_IMPORT'));
	if (!bError)
	{
		Screens.showReport(TextUtils.i18n('%MODULENAME%/INFO_UPLOAD_COMPLETED'));
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/UNKNOWN_ERROR'));
	}
};

module.exports = new ImportExportPopup();
