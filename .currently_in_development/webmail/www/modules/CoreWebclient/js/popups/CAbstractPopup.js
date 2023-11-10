'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js')
;

function CAbstractPopup()
{
	this.opened = ko.observable(false);
	this.$popupDom = null;
}

CAbstractPopup.prototype.PopupTemplate = '';

CAbstractPopup.prototype.openPopup = function (aParameters)
{
	if (this.$popupDom && !this.opened())
	{
		this.showPopup();

		Popups.addPopup(this);
	}
		
	this.onOpen.apply(this, aParameters);
};

CAbstractPopup.prototype.closePopup = function ()
{
	if (this.$popupDom && this.opened())
	{
		this.hidePopup();
		
		Popups.removePopup(this);
		
		this.onClose();
	}
};

CAbstractPopup.prototype.showPopup = function ()
{
	if (this.$popupDom && !this.opened())
	{
		this.$popupDom.show();

		this.opened(true);

		_.delay(_.bind(function() {
			this.$popupDom.addClass('visible');
		}, this), 50);
		
		this.onShow();
	}
};

CAbstractPopup.prototype.hidePopup = function ()
{
	if (this.$popupDom && this.opened())
	{
		this.$popupDom.hide();
		
		this.opened(false);
		
		this.$popupDom.removeClass('visible').hide();
		
		this.onHide();
	}
};

CAbstractPopup.prototype.cancelPopup = function ()
{
	this.closePopup();
};

CAbstractPopup.prototype.onEscHandler = function (oEvent)
{
	this.cancelPopup();
};

CAbstractPopup.prototype.onEnterHandler = function ()
{
};

CAbstractPopup.prototype.onBind = function ()
{
};

CAbstractPopup.prototype.onOpen = function ()
{
};

CAbstractPopup.prototype.onClose = function ()
{
};

CAbstractPopup.prototype.onShow = function ()
{
};

CAbstractPopup.prototype.onHide = function ()
{
};

CAbstractPopup.prototype.onRoute = function (aParams)
{
};

module.exports = CAbstractPopup;