'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js')
;

/**
 * @constructor
 * @param {string} sServerModule
 */
function CAbstractSettingsFormView(sServerModule)
{
	this.sServerModule = sServerModule ? sServerModule : 'Core';
	
	this.isSaving = ko.observable(false);
	
	this.visible = ko.observable(true);
	
	this.sSavedState = '';
	
	this.bShown = false;
	
	this.SettingsTabName = '';
	this.SettingsTabTitle = '';
	this.aSettingsSections = [];
}

CAbstractSettingsFormView.prototype.ViewTemplate = ''; // should be overriden

CAbstractSettingsFormView.prototype.addSettingsSection = function (oSection)
{
	this.aSettingsSections.push(oSection);
};

/**
 * @param {Object} oData
 */
CAbstractSettingsFormView.prototype.showTab = function (oData)
{
	this.bShown = true;
	this.revert();
	if (_.isFunction(this.onShow))
	{
		this.onShow(oData);
	}
	_.each(this.aSettingsSections, function (oSection) {
		if (_.isFunction(oSection.onShow))
		{
			oSection.onShow(oData);
		}
	});
};

/**
 * Checks if there are changes in settings form.
 * @returns {Boolean}
 */
CAbstractSettingsFormView.prototype.hasUnsavedChanges = function ()
{
	// changes in form itself
	var bStateChanged = this.getCurrentState() !== this.sSavedState;
	
	// changes in form sections from other modules
	_.each(this.aSettingsSections, function (oSection) {
		if (_.isFunction(oSection.getCurrentState))
		{
			bStateChanged = bStateChanged || oSection.getCurrentState() !== oSection.sSavedState;
		}
	});
	
	return bStateChanged;
};

/**
 * Hides settings form if there are no changes or user allows to discard them.
 * @param {Function} fAfterHideHandler Handler should be executed to hide settings form.
 * @param {Function} fRevertRouting Handler should be executed to revert routing if settings form can't be hidden.
 */
CAbstractSettingsFormView.prototype.hide = function (fAfterHideHandler, fRevertRouting)
{
	if (this.hasUnsavedChanges())
	{
		Popups.showPopup(ConfirmPopup, [TextUtils.i18n('COREWEBCLIENT/CONFIRM_DISCARD_CHANGES'), _.bind(function (bDiscard) {
			if (bDiscard)
			{
				this.bShown = false;
				fAfterHideHandler();
				this.revert();
			}
			else if (_.isFunction(fRevertRouting))
			{
				fRevertRouting();
			}
		}, this)]);
	}
	else
	{
		this.bShown = false;
		fAfterHideHandler();
	}
};

/**
 * Returns an array with the values of editable fields.
 * 
 * Should be overriden.
 * 
 * @returns {Array}
 */
CAbstractSettingsFormView.prototype.getCurrentValues = function ()
{
	return [];
};

/**
 * @returns {String}
 */
CAbstractSettingsFormView.prototype.getCurrentState = function ()
{
	var aState = this.getCurrentValues();
	
	return aState.join(':');
};

CAbstractSettingsFormView.prototype.updateSavedState = function()
{
	this.sSavedState = this.getCurrentState();
};

/**
 * Puts values from the global settings object to the editable fields.
 * 
 * Should be overriden.
 */
CAbstractSettingsFormView.prototype.revertGlobalValues = function ()
{
	
};

CAbstractSettingsFormView.prototype.revert = function ()
{
	_.each(this.aSettingsSections, function (oSection) {
		if (_.isFunction(oSection.revert))
		{
			oSection.revert();
		}
	});
	
	this.revertGlobalValues();
	
	this.updateSavedState();
};

/**
 * Gets values from the editable fields and prepares object for passing to the server and saving settings therein.
 * 
 * Should be overriden.
 * 
 * @returns {Object}
 */
CAbstractSettingsFormView.prototype.getParametersForSave = function ()
{
	return {};
};

/**
 * Sends a request to the server to save the settings.
 */
CAbstractSettingsFormView.prototype.save = function ()
{
	if (!_.isFunction(this.validateBeforeSave) || this.validateBeforeSave())
	{
		this.isSaving(true);

		Ajax.send(this.sServerModule, 'UpdateSettings', this.getParametersForSave(), this.onResponse, this);
	}
};

/**
 * Applies saved values of settings to the global settings object.
 * 
 * Should be overriden.
 * 
 * @param {Object} oParameters Object that have been obtained by getParameters function.
 */
CAbstractSettingsFormView.prototype.applySavedValues = function (oParameters)
{
	
};

/**
 * Parses the response from the server.
 * If the settings are normally stored, then updates them in the global settings object. 
 * Otherwise shows an error message.
 * 
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CAbstractSettingsFormView.prototype.onResponse = function (oResponse, oRequest)
{
	this.isSaving(false);

	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('COREWEBCLIENT/ERROR_SAVING_SETTINGS_FAILED'));
	}
	else
	{
		var oParameters = oRequest.Parameters;
		
		this.updateSavedState();

		this.applySavedValues(oParameters);
		
		Screens.showReport(TextUtils.i18n('COREWEBCLIENT/REPORT_SETTINGS_UPDATE_SUCCESS'));
	}
};

/**
 * Should be overriden.
 * 
 * @param {string} sEntityType
 * @param {int} iEntityId
 */
CAbstractSettingsFormView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
};

module.exports = CAbstractSettingsFormView;
