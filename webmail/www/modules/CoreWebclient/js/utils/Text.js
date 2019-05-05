'use strict';

var
	$ = require('jquery'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Settings = require('%PathToCoreWebclientModule%/js/Settings.js'),
	
	I18n = window.auroraI18n,
	
	TextUtils = {}
;

/**
 * @param {string} sText
 * 
 * @return {string}
 */
TextUtils.encodeHtml = function (sText)
{
	return (sText) ? sText.toString()
		.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '';
};

/**
 * @param {string} sHtml
 * @returns {Boolean}
 */
TextUtils.htmlStartsWithBlockquote = function (sHtml)
{
	var
		aParts = sHtml.split('<blockquote'),
		sBegin = aParts.length > 0 ? aParts[0] : '',
		sBeginWithoutTags = $.trim(sBegin.replace(/<[^>]*>/g, ''))
	;
	
	return sBeginWithoutTags === '';
};


/**
 * @param {string} sKey
 * @param {?Object=} oValueList
 * @param {?string=} sDefaultValue
 * @param {number=} iPluralCount
 * 
 * @return {string}
 */
TextUtils.i18n = function (sKey, oValueList, sDefaultValue, iPluralCount) {
	var
		sValueName = '',
		sResult = Types.isNonEmptyString(sDefaultValue) ? sDefaultValue : sKey
	;
	
	if (Types.isNonEmptyString(sKey))
	{
		if (Types.isNonEmptyString(I18n[sKey]))
		{
			sResult = I18n[sKey];
		}
		else
		{
			sKey = sKey.replace(('MobileWebclient').toUpperCase(), ('Webclient').toUpperCase());
			if (Types.isNonEmptyString(I18n[sKey]))
			{
				sResult = I18n[sKey];
			}
		}
	}
	
	if (Types.isPositiveNumber(iPluralCount))
	{
		sResult = (function (iPluralCount, sResult) {
			var
				nPlural = TextUtils.getPlural(Settings.Language, iPluralCount),
				aPluralParts = sResult.split('|')
			;

			return (aPluralParts && aPluralParts[nPlural]) ? aPluralParts[nPlural] : (
				aPluralParts && aPluralParts[0] ? aPluralParts[0] : sResult);

		}(iPluralCount, sResult));
	}

	if (oValueList)
	{
		for (sValueName in oValueList)
		{
			if (oValueList.hasOwnProperty(sValueName))
			{
				var reg = new RegExp('%' + sValueName + '%', 'g');
				sResult = sResult.replace(reg, oValueList[sValueName]);
			}
		}
	}

	return sResult;
};

/**
 * http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html?id=l10n/pluralforms
 * 
 * @param {string} sLang
 * @param {number} iNumber
 * 
 * @return {number}
 */
TextUtils.getPlural = function (sLang, iNumber)
{
	var iResult = 0;
	iNumber = Types.pInt(iNumber);

	switch (sLang)
	{
		case 'Arabic':
			iResult = (iNumber === 0 ? 0 : iNumber === 1 ? 1 : iNumber === 2 ? 2 : iNumber % 100 >= 3 && iNumber % 100 <= 10 ? 3 : iNumber % 100 >= 11 ? 4 : 5);
			break;
		case 'Bulgarian':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Chinese-Simplified':
			iResult = 0;
			break;
		case 'Chinese-Traditional':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Czech':
			iResult = (iNumber === 1) ? 0 : (iNumber >= 2 && iNumber <= 4) ? 1 : 2;
			break;
		case 'Danish':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Dutch':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'English':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Estonian':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Finnish':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'French':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'German':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Greek':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Hebrew':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Hungarian':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Italian':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Japanese':
			iResult = 0;
			break;
		case 'Korean':
			iResult = 0;
			break;
		case 'Latvian':
			iResult = (iNumber % 10 === 1 && iNumber % 100 !== 11 ? 0 : iNumber !== 0 ? 1 : 2);
			break;
		case 'Lithuanian':
			iResult = (iNumber % 10 === 1 && iNumber % 100 !== 11 ? 0 : iNumber % 10 >= 2 && (iNumber % 100 < 10 || iNumber % 100 >= 20) ? 1 : 2);
			break;
		case 'Norwegian':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Persian':
			iResult = 0;
			break;
		case 'Polish':
			iResult = (iNumber === 1 ? 0 : iNumber % 10 >= 2 && iNumber % 10 <= 4 && (iNumber % 100 < 10 || iNumber % 100 >= 20) ? 1 : 2);
			break;
		case 'Portuguese-Portuguese':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Portuguese-Brazil':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Romanian':
			iResult = (iNumber === 1 ? 0 : (iNumber === 0 || (iNumber % 100 > 0 && iNumber % 100 < 20)) ? 1 : 2);
			break;
		case 'Russian':
			iResult = (iNumber % 10 === 1 && iNumber % 100 !== 11 ? 0 : iNumber % 10 >= 2 && iNumber % 10 <= 4 && (iNumber % 100 < 10 || iNumber % 100 >= 20) ? 1 : 2);
			break;
		case 'Slovenian':
			iResult = ((iNumber % 10 === 1 && iNumber % 100 !== 11) ? 0 : ((iNumber % 10 === 2 && iNumber % 100 !== 12) ? 1 : 2));
			break;
		case 'Serbian':
			iResult = (iNumber % 10 === 1 && iNumber % 100 !== 11 ? 0 : iNumber % 10 >= 2 && iNumber % 10 <= 4 && (iNumber % 100 < 10 || iNumber % 100 >= 20) ? 1 : 2);
			break;
		case 'Spanish':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Swedish':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Thai':
			iResult = 0;
			break;
		case 'Turkish':
			iResult = (iNumber === 1 ? 0 : 1);
			break;
		case 'Ukrainian':
			iResult = (iNumber % 10 === 1 && iNumber % 100 !== 11 ? 0 : iNumber % 10 >= 2 && iNumber % 10 <= 4 && (iNumber % 100 < 10 || iNumber % 100 >= 20) ? 1 : 2);
			break;
		case 'Vietnamese':
			iResult = 0;
			break;
		default:
			iResult = 0;
			break;
	}

	return iResult;
};

/**
 * Convert string in CamelCase format to dash-separated
 * 
 * @param {string} sName
 * @returns {string}
 */

TextUtils.getUrlFriendlyName = function (sName)
{
	return sName.replace(/([A-Z])/g, '-$1').replace(/(^-)/g, '').replace(/\s+/g, '-').replace(/-{2,}/g, '-').toLowerCase();
};

/**
 * @param {(number|string)} iSizeInBytes
 * 
 * @return {string}
 */
TextUtils.getFriendlySize = function (iSizeInBytes)
{
	var
		iBytesInKb = 1024,
		iBytesInMb = iBytesInKb * iBytesInKb,
		iBytesInGb = iBytesInKb * iBytesInKb * iBytesInKb
	;

	iSizeInBytes = Types.pInt(iSizeInBytes);

	if (iSizeInBytes >= iBytesInGb)
	{
		return Types.roundNumber(iSizeInBytes / iBytesInGb, 1) + TextUtils.i18n('%MODULENAME%/LABEL_GIGABYTES');
	}
	else if (iSizeInBytes >= iBytesInMb)
	{
		return Types.roundNumber(iSizeInBytes / iBytesInMb, 1) + TextUtils.i18n('%MODULENAME%/LABEL_MEGABYTES');
	}
	else if (iSizeInBytes >= iBytesInKb)
	{
		return Types.roundNumber(iSizeInBytes / iBytesInKb, 0) + TextUtils.i18n('%MODULENAME%/LABEL_KILOBYTES');
	}

	return iSizeInBytes + TextUtils.i18n('%MODULENAME%/LABEL_BYTES');
};

module.exports = TextUtils;
