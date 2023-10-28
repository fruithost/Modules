'use strict';

var
	ko = require('knockout'),

	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js')
;

/**
 * @constructor
 */
function CAliasModel()
{
	this.ALIAS = true; // constant

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
		return Utils.getHash(this.accountId() + 'alias' + this.id());
	}, this);
}

/**
 * @param {Object} oData
 */
CAliasModel.prototype.parse = function (oData)
{
	if (oData['@Object'] === 'Object/Aurora\\Modules\\CpanelIntegrator\\Classes\\Alias')
	{
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

module.exports = CAliasModel;
