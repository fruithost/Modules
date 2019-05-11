'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	CFilterModel = require('modules/%ModuleName%/js/models/CFilterModel.js')
;

/**
 * @constructor
 */
function CFiltersModel()
{
	this.iAccountId = 0;
	this.collection = ko.observableArray([]);
}

/**
 * @param {number} iAccountId
 * @param {Object} oData
 */
CFiltersModel.prototype.parse = function (iAccountId, oData)
{
	var 
		iIndex = 0,
		iLen = oData.length,
		oSieveFilter = null
	;

	this.iAccountId = iAccountId;
	
	if (_.isArray(oData))
	{
		for (iLen = oData.length; iIndex < iLen; iIndex++)
		{	
			oSieveFilter =  new CFilterModel(iAccountId);
			oSieveFilter.parse(oData[iIndex]);
			this.collection.push(oSieveFilter);
		}
	}
};

module.exports = CFiltersModel;