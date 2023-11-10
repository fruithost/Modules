'use strict';

var
	ko = require('knockout'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

function CAbstractScreenView(sModuleName)
{
	this.shown = ko.observable(false);
	this.$viewDom = null;
	this.browserTitle = ko.observable('');
	this.sModuleName = sModuleName;
}

CAbstractScreenView.prototype.ViewTemplate = '';
CAbstractScreenView.prototype.ViewConstructorName = '';

CAbstractScreenView.prototype.showView = function ()
{
	if (!this.shown())
	{
		this.$viewDom.show();
		this.shown(true);
		this.onShow();

		if (this.ViewConstructorName !== '')
		{
			App.broadcastEvent(this.sModuleName + '::ShowView::after', {'Name': this.ViewConstructorName, 'View': this});
		}
	}
};

CAbstractScreenView.prototype.hideView = function ()
{
	if (this.shown())
	{
		this.$viewDom.hide();
		this.shown(false);
		this.onHide();
	}
};

CAbstractScreenView.prototype.onBind = function ()
{
};

CAbstractScreenView.prototype.onShow = function ()
{
};

CAbstractScreenView.prototype.onHide = function ()
{
};

CAbstractScreenView.prototype.onRoute = function (aParams)
{
};

module.exports = CAbstractScreenView;