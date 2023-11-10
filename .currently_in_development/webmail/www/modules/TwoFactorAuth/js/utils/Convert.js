'use strict';

var ConvertUtils = {};

ConvertUtils.base64ToArrayBuffer = function (sBase64)
{
	var
		sBinary = window.atob(sBase64),
		iLen = sBinary.length,
		oBytes = new Uint8Array(iLen)
	;
	for (var i = 0; i < iLen; i++)
	{
		oBytes[i] = sBinary.charCodeAt(i);
	}
	return oBytes.buffer;
};

ConvertUtils.arrayBufferToBase64 = function (buffer)
{
	var
		sBinary = '',
		oBytes = new Uint8Array(buffer),
		iLen = oBytes.byteLength
	;
	for (var i = 0; i < iLen; i++)
	{
		sBinary += String.fromCharCode(oBytes[ i ]);
	}
	return window.btoa(sBinary);
};

module.exports = ConvertUtils;