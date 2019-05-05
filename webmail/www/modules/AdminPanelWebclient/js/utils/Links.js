'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	EntitiesTabs = require('modules/%ModuleName%/js/EntitiesTabs.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	sSrchPref = 's.',
	sPagePref = 'p.',
	
	Links = {}
;

/**
 * Returns true if parameter contains path value.
 * @param {string} sTemp
 * @return {boolean}
 */
function IsPageParam(sTemp)
{
	return (sPagePref === sTemp.substr(0, 1) && (/^[1-9][\d]*$/).test(sTemp.substr(sPagePref.length)));
};

/**
 * Returns true if parameter contains search value.
 * @param {string} sTemp
 * @return {boolean}
 */
function IsSearchParam(sTemp)
{
	return (sSrchPref === sTemp.substr(0, sSrchPref.length));
};

/**
 * @param {Array=} aEntities
 * @param {string=} sCurrEntityType = ''
 * @param {string=} sLast = ''
 * @param {number=} iPage = 1
 * @param {string=} sSearch = ''
 * @return {Array}
 */
Links.get = function (sCurrEntityType, aEntities, sLast, iPage, sSearch)
{
	var
		aResult = [Settings.HashModuleName],
		bContinue = true;
	;
	
	aEntities = aEntities || [];
	
	_.each(EntitiesTabs.getData(), function (oEntityData) {
		if (bContinue)
		{
			if (Types.isPositiveNumber(aEntities[oEntityData.Type]))
			{
				if (oEntityData.Type !== 'User' || sCurrEntityType !== 'MailingList')
				{
					aResult.push(oEntityData.ScreenHash.substr(0,1) + aEntities[oEntityData.Type]);
				}
			}
			else if (sCurrEntityType === oEntityData.Type)
			{
				aResult.push(oEntityData.ScreenHash);
			}
			if (sCurrEntityType === oEntityData.Type)
			{
				bContinue = false;
			}
		}
	});
	
	if (Types.isPositiveNumber(iPage) && iPage > 1)
	{
		aResult.push(sPagePref + iPage);
	}
	
	if (Types.isNonEmptyString(sSearch))
	{
		aResult.push(sSrchPref + sSearch);
	}
	
	if (Types.isNonEmptyString(sLast))
	{
		aResult.push(sLast);
	}
	
	return aResult;
};

/**
 * @param {Array} aParams
 * 
 * @return {Object}
 */
Links.parse = function (aParams)
{
	var
		iIndex = 0,
		oEntities = {},
		sCurrEntityType = '',
		iPage = 1,
		sSearch = '',
		sTemp = ''
	;
	
	_.each(EntitiesTabs.getData(), function (oEntityData) {
		if (aParams[iIndex] && oEntityData.ScreenHash === aParams[iIndex])
		{
			sCurrEntityType = oEntityData.Type;
			iIndex++;
		}
		if (aParams[iIndex] && oEntityData.ScreenHash.substr(0, 1) === aParams[iIndex].substr(0, 1) && Types.pInt(aParams[iIndex].substr(1)) > 0)
		{
			oEntities[oEntityData.Type] = Types.pInt(aParams[iIndex].substr(1));
			sCurrEntityType = oEntityData.Type;
			iIndex++;
		}
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsPageParam(sTemp))
			{
				iPage = Types.pInt(sTemp.substr(sPagePref.length));
				if (iPage <= 0)
				{
					iPage = 1;
				}
				iIndex++;
			}
		}
		if (aParams.length > iIndex)
		{
			sTemp = Types.pString(aParams[iIndex]);
			if (IsSearchParam(sTemp))
			{
				sSearch = sTemp.substr(sSrchPref.length);
				iIndex++;
			}
		}
	});
	
	return {
		Entities: oEntities,
		CurrentType: sCurrEntityType,
		Last: Types.isNonEmptyString(aParams[iIndex]) ? aParams[iIndex] : '',
		Page: iPage,
		Search: sSearch
	};
};

module.exports = Links;
