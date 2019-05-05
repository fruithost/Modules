'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js')
;

/**
 * @constructor
 */
function CInformationView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.iReportDuration = 5000;
	this.iErrorDuration = 10000;
	
	this.loadingMessage = ko.observable('');
	this.loadingHidden = ko.observable(true);
	this.reportMessage = ko.observable('');
	this.reportHidden = ko.observable(true);
	this.closeReportButtonVisible = ko.observable(false);
	this.iReportTimeout = -1;
	this.errorMessage = ko.observable('');
	this.errorHidden = ko.observable(true);
	this.iErrorTimeout = -1;
	this.gray = ko.observable(false);
	
	this.selfHideError = _.bind(this.selfHideError, this);
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CInformationView.prototype, CAbstractScreenView.prototype);

CInformationView.prototype.ViewTemplate = '%ModuleName%_InformationView';
CInformationView.prototype.ViewConstructorName = 'CInformationView';

/**
 * @param {string} sMessage
 */
CInformationView.prototype.showLoading = function (sMessage)
{
	if (sMessage && sMessage !== '')
	{
		this.loadingMessage(sMessage);
	}
	else
	{
		this.loadingMessage(TextUtils.i18n('%MODULENAME%/INFO_LOADING'));
	}
	
	this.loadingHidden(false);
};

CInformationView.prototype.hideLoading = function ()
{
	this.loadingHidden(true);
};

/**
 * Displays a message. Starts a timer for hiding.
 * 
 * @param {string} sMessage
 * @param {number=} iDelay
 */
CInformationView.prototype.showReport = function (sMessage, iDelay)
{
	if (iDelay !== 0)
	{
		iDelay = iDelay || this.iReportDuration;
	}
	
	if (sMessage && sMessage !== '')
	{
		this.reportMessage(sMessage);
		
		this.reportHidden(false);
		
		clearTimeout(this.iReportTimeout);
		if (iDelay === 0)
		{
			this.closeReportButtonVisible(true);
		}
		else
		{
			this.closeReportButtonVisible(false);
			this.iReportTimeout = setTimeout(_.bind(this.hideReport, this), iDelay);
		}
	}
	else
	{
		this.hideReport();
	}
};

CInformationView.prototype.hideReport = function ()
{
	this.reportHidden(true);
};

/**
 * Displays an error message. Starts a timer for hiding.
 *
 * @param {string} sMessage
 * @param {boolean=} bNotHide = false
 * @param {boolean=} bGray = false
 */
CInformationView.prototype.showError = function (sMessage, bNotHide, bGray)
{
	if (sMessage && sMessage !== '')
	{
		this.gray(!!bGray);
		this.errorMessage(sMessage);
		
		this.errorHidden(false);
		
		clearTimeout(this.iErrorTimeout);
		if (!bNotHide)
		{
			this.iErrorTimeout = setTimeout(this.selfHideError, this.iErrorDuration);
		}
	}
	else
	{
		this.selfHideError();
	}
};

CInformationView.prototype.selfHideError = function ()
{
	this.errorHidden(true);
};

/**
 * @param {boolean=} bGray = false
 */
CInformationView.prototype.hideError = function (bGray)
{
	if (this.gray() === !!bGray)
	{
		this.selfHideError();
	}
};

module.exports = new CInformationView();
