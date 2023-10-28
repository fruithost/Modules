'use strict';

var
	ko = require('knockout'),
	
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js')
;

/**
 * @constructor
 */
function CFetcherModel()
{
	this.FETCHER = true; // constant
	
	this.id = ko.observable(0);
	this.accountId = ko.observable(0);
	this.hash = ko.computed(function () {
		return Utils.getHash(this.accountId() + 'fetcher' + this.id());
	}, this);
	this.isEnabled = ko.observable(false);
	this.isLocked = ko.observable(false).extend({'autoResetToFalse': 1000});
	this.email = ko.observable('');
	this.userName = ko.observable('');
	this.folder = ko.observable('');
	this.useSignature = ko.observable(false);
	this.signature = ko.observable('');
	this.incomingServer = ko.observable('');
	this.incomingPort = ko.observable(0);
	this.incomingUseSsl = ko.observable(false);
	this.incomingLogin = ko.observable('');
	this.leaveMessagesOnServer = ko.observable('');
	this.isOutgoingEnabled = ko.observable(false);
	this.outgoingServer = ko.observable('');
	this.outgoingPort = ko.observable(0);
	this.outgoingUseSsl = ko.observable(false);
	this.outgoingUseAuth = ko.observable(false);
	
	this.iCheckIntervalMinutes = 0;
	
	this.fullEmail = ko.computed(function () {
		return AddressUtils.getFullEmail(this.userName(), this.email());
	}, this);
}

/**
 * @param {Object} oData
 */
CFetcherModel.prototype.parse = function (oData)
{
	this.id(Types.pInt(oData.EntityId));
	this.accountId(Types.pInt(oData.IdAccount));
	this.isEnabled(!!oData.IsEnabled);
	this.isLocked(!!oData.IsLocked);
	this.email(Types.pString(oData.Email));
	this.userName(Types.pString(oData.Name));
	this.folder(Types.pString(oData.Folder));
	this.useSignature(!!oData.UseSignature);
	var sSignature = Types.pString(oData.Signature);
	if (sSignature.indexOf('<') !== 0) {
		sSignature = '<div>' + sSignature + '</div>';
	}
	this.signature = ko.observable(sSignature);
	this.incomingServer(Types.pString(oData.IncomingServer));
	this.incomingPort(Types.pInt(oData.IncomingPort));
	this.incomingUseSsl(!!oData.IncomingUseSsl);
	this.incomingLogin(Types.pString(oData.IncomingLogin));
	this.leaveMessagesOnServer(!!oData.LeaveMessagesOnServer);
	this.isOutgoingEnabled(!!oData.IsOutgoingEnabled);
	this.outgoingServer(Types.pString(oData.OutgoingServer));
	this.outgoingPort(Types.pInt(oData.OutgoingPort));
	this.outgoingUseSsl(!!oData.OutgoingUseSsl);
	this.outgoingUseAuth(!!oData.OutgoingUseAuth);
	this.iCheckIntervalMinutes = Types.pInt(oData.CheckInterval, 0);
};

module.exports = CFetcherModel;
