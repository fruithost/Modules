'use strict';

var
	_ = require('underscore'),
	
	Types = {},
	
	aStandardPerPageList = [10, 20, 30, 50, 75, 100, 150, 200]
;

/**
 * @param {*} mValue
 * 
 * @return {boolean}
 */
Types.isString = function (mValue)
{
	return typeof mValue === 'string';
};

/**
 * @param {*} mValue
 * 
 * @return {boolean}
 */
Types.isNonEmptyString = function (mValue)
{
	return Types.isString(mValue) && mValue !== '';
};

/**
 * @param {*} mValue
 * @param {string} sDefault
 * @return {string}
 */
Types.pString = function (mValue, sDefault)
{
	if (mValue !== undefined && mValue !== null)
	{
		return mValue.toString();
	}
	if (typeof sDefault === 'string')
	{
		return sDefault;
	}
	return '';
};

/**
 * @param {*} mValue
 * 
 * @return {boolean}
 */
Types.isNumber = function (mValue)
{
	return typeof mValue === 'number';
};

/**
 * @param {*} mValue
 * 
 * @return {boolean}
 */
Types.isPositiveNumber = function (mValue)
{
	return Types.isNumber(mValue) && mValue > 0;
};

/**
 * @param {*} mValue
 * @param {number} iDefault
 * 
 * @return {number}
 */
Types.pInt = function (mValue, iDefault)
{
	var iValue = window.parseInt(mValue, 10);
	if (isNaN(iValue))
	{
		iValue = !isNaN(iDefault) ? iDefault : 0;
	}
	return iValue;
};

Types.pArray = function (mValue, aDefault)
{
	if (_.isArray(mValue))
	{
		return mValue;
	}
	if (_.isArray(aDefault))
	{
		return aDefault;
	}
	return [];
};

Types.pObject = function (mValue, oDefault)
{
	if (typeof mValue === 'object' && !_.isEmpty(mValue))
	{
		return mValue;
	}
	if (typeof oDefault === 'object' && !_.isEmpty(oDefault))
	{
		return oDefault;
	}
	return {};
};

Types.pPositiveInt = function (mValue, iDefault)
{
	var iValue = window.parseInt(mValue, 10);
	if (!isNaN(iValue) && iValue >= 1)
	{
		return iValue;
	}
	if (!isNaN(iDefault) && iDefault >= 1)
	{
		return iDefault;
	}
	return 1;
};

Types.pNonNegativeInt = function (mValue, iDefault)
{
	var iValue = window.parseInt(mValue, 10);
	if (!isNaN(iValue) && iValue >= 0)
	{
		return iValue;
	}
	if (!isNaN(iDefault) && iDefault >= 0)
	{
		return iDefault;
	}
	return 0;
};

Types.pBool = function (mValue, bDefault)
{
	if (typeof mValue === 'boolean')
	{
		return mValue;
	}
	if (typeof bDefault === 'boolean')
	{
		return bDefault;
	}
	return false;
};

Types.pEnum = function (mValue, oEnum, mDefault)
{
	if (mValue === _.find(oEnum, function(mEnumValue){ return mEnumValue === mValue; }))
	{
		return mValue;
	}
	if (mDefault === _.find(oEnum, function(mEnumValue){ return mEnumValue === mDefault; }))
	{
		return mDefault;
	}
	return _.find(oEnum, function(mEnumValue){ return true; });
};

/**
 * @param {number} iNum
 * @param {number} iDec
 * 
 * @return {number}
 */
Types.roundNumber = function (iNum, iDec)
{
	return Math.round(iNum * Math.pow(10, iDec)) / Math.pow(10, iDec);
};

/**
 * @param {*} aValue
 * @param {number=} iArrayLen
 * 
 * @return {boolean}
 */
Types.isNonEmptyArray = function (aValue, iArrayLen)
{
	iArrayLen = iArrayLen || 1;
	
	return _.isArray(aValue) && iArrayLen <= aValue.length;
};

/**
 * @param {number} iValue
 * 
 * @returns {Array}
 */
Types.getAdaptedPerPageList = function (iValue)
{
	if (-1 === _.indexOf(aStandardPerPageList, iValue))
	{
		return _.sortBy(_.union(aStandardPerPageList, [iValue]), function (iItem) { return iItem; });
	}
	
	return aStandardPerPageList;
};

/**
 * @param {*} mValue
 * @param {float} dDefault
 * 
 * @return {number}
 */
Types.pDouble = function (mValue, dDefault)
{
	var dValue = window.parseFloat(mValue);
	if (isNaN(dValue))
	{
		dValue = !isNaN(dDefault) ? dDefault : 0;
	}
	return dValue;
};

module.exports = Types;
