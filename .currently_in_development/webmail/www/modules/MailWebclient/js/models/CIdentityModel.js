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
function CIdentityModel()
{
	this.IDENTITY = true; // constant
	
	this.bAccountPart = false;
	this.isDefault = ko.observable(false);
	this.email = ko.observable('');
	this.friendlyName = ko.observable('');
	this.fullEmail = ko.computed(function () {
		return AddressUtils.getFullEmail(this.friendlyName(), this.email());
	}, this);
	this.accountId = ko.observable(-1);
	this.id = ko.observable(-1);
	this.signature = ko.observable('');
	this.useSignature = ko.observable(false);
	this.hash = ko.computed(function () {
		return Utils.getHash(this.accountId() + 'identity' + this.id());
	}, this);
}

/**
 * @param {Object} oData
 */
CIdentityModel.prototype.parse = function (oData)
{
	if (oData['@Object'] === 'Object/Aurora\\Modules\\Mail\\Classes\\Identity')
	{
		this.bAccountPart = !!oData.AccountPart;
		this.isDefault(!!oData.Default);
		this.email(Types.pString(oData.Email));
		this.friendlyName(Types.pString(oData.FriendlyName));
		this.accountId(Types.pInt(oData.IdAccount));
		this.id(Types.pInt(oData.EntityId));
		var sSignature = Types.pString(oData.Signature);
		if (sSignature.indexOf('<') !== 0) {
			sSignature = '<div>' + sSignature + '</div>';
		}
		this.signature = ko.observable(sSignature);
		this.useSignature(!!oData.UseSignature);
	}
};

module.exports = CIdentityModel;
