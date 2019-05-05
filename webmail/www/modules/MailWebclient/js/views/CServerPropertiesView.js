'use strict';

var
	$ = require('jquery'),
	ko = require('knockout'),
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * @constructor
 * 
 * @param {number} iDefaultPort
 * @param {number} iDefaultSslPort
 * @param {string} sId
 * @param {string} sLabel
 * @param {function} koDefaultServerValue
 */
function CServerPropertiesView(iDefaultPort, iDefaultSslPort, sId, sLabel, koDefaultServerValue)
{
	this.server = ko.observable('');
	this.server.focused = ko.observable(false);
	this.label = sLabel;
	this.defaultPort = ko.observable(iDefaultPort);
	this.defaultSslPort = ko.observable(iDefaultSslPort);
	this.port = ko.observable(iDefaultPort);
	this.port.focused = ko.observable(false);
	this.ssl = ko.observable(false);
	this.isEnabled = ko.observable(true);
	this.id = sId;

	if ($.isFunction(koDefaultServerValue))
	{
		koDefaultServerValue.focused.subscribe(function () {
			if (!koDefaultServerValue.focused() && this.server() === '')
			{
				this.server(koDefaultServerValue());
			}
		}, this);
	}
	
	this.ssl.subscribe(function () {
		var iPort = Types.pInt(this.port());
		if (this.ssl())
		{
			if (iPort === this.defaultPort())
			{
				this.port(this.defaultSslPort());
			}
		}
		else
		{
			if (iPort === this.defaultSslPort())
			{
				this.port(this.defaultPort());
			}
		}
	}, this);
}

/**
 * @param {string} sServer
 * @param {number} iPort
 * @param {boolean} bSsl
 */
CServerPropertiesView.prototype.set = function (sServer, iPort, bSsl)
{
	this.server(sServer);
	this.ssl(bSsl);
	this.port(iPort);
};

CServerPropertiesView.prototype.clear = function ()
{
	this.server('');
	this.ssl(false);
	this.port(this.defaultPort());
};

CServerPropertiesView.prototype.getIntPort = function ()
{
	return Types.pInt(this.port());
};

CServerPropertiesView.prototype.parentSave = function (koCurrentField, aParents)
{
	if (koCurrentField.focused)
	{
		koCurrentField.focused(false);
	}
	
	var oParent = _.find(aParents, function (oTmpParent) {
		return _.isFunction(oTmpParent.save);
	});
	
	if (oParent)
	{
		oParent.save();
	}
};

module.exports = CServerPropertiesView;
