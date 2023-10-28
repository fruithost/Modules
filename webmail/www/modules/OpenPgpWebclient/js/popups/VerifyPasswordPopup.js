'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	
	ErrorsUtils = require('modules/%ModuleName%/js/utils/Errors.js'),
	
	OpenPgp = require('modules/%ModuleName%/js/OpenPgp.js')
;

/**
 * @constructor
 */
function CVerifyPasswordPopup()
{
	CAbstractPopup.call(this);
	
	this.password = ko.observable('');
	this.oKey = null;
	this.fOkCallback = null;
}

_.extendOwn(CVerifyPasswordPopup.prototype, CAbstractPopup.prototype);

CVerifyPasswordPopup.prototype.PopupTemplate = '%ModuleName%_VerifyPasswordPopup';

/**
 * @param {object} oKey
 * @param {Function} fOkCallback
 */
CVerifyPasswordPopup.prototype.onOpen = function (oKey, fOkCallback)
{
	this.password('');
	this.oKey = oKey;
	this.fOkCallback = fOkCallback;
};

CVerifyPasswordPopup.prototype.confirmPasswordAndView = async function ()
{
	var oResult = await OpenPgp.verifyKeyPassword(this.oKey, this.password());

	if (oResult.errors)
	{
		ErrorsUtils.showPgpErrorByCode(oResult);
	}
	else
	{
		if (_.isFunction(this.fOkCallback))
		{
			this.fOkCallback();
			this.closePopup();
		}
	}
};

module.exports = new CVerifyPasswordPopup();
