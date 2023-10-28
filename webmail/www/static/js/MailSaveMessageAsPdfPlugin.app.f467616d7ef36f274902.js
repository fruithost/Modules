(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[25],{

/***/ "ciL+":
/*!**********************************************************!*\
  !*** ./modules/MailSaveMessageAsPdfPlugin/js/manager.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (oAppData) {
	var
		$ = __webpack_require__(/*! jquery */ "EVdn"),
		
		TextUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Text.js */ "RN+F"),
		UrlUtils = __webpack_require__(/*! modules/CoreWebclient/js/utils/Url.js */ "ZP6a"),
		
		Ajax = __webpack_require__(/*! modules/CoreWebclient/js/Ajax.js */ "o0Bx"),
		Api = __webpack_require__(/*! modules/CoreWebclient/js/Api.js */ "JFZZ"),
		App = __webpack_require__(/*! modules/CoreWebclient/js/App.js */ "IAk5")
	;
	
	if (App.isUserNormalOrTenant())
	{
		return {
			start: function (ModulesManager) {
				App.subscribeEvent('MailWebclient::AddMoreSectionCommand', function (fAddMoreSectionCommand) {
					fAddMoreSectionCommand({
						'Text': TextUtils.i18n('MAILSAVEMESSAGEASPDFPLUGIN/ACTION_DOWNLOAD_PDF'),
						'CssClass': 'pdf',
						'Handler': function () {
							if (this.currentMessage())
							{
								var
									oBody = this.currentMessage().getDomText(),
									fReplaceWithBase64 = function (oImg) {
										try
										{
											var
												oCanvas = document.createElement('canvas'),
												oCtx = null
											;

											oCanvas.width = oImg.width;
											oCanvas.height = oImg.height;

											oCtx = oCanvas.getContext('2d');
											oCtx.drawImage(oImg, 0, 0);

											oImg.src = oCanvas.toDataURL('image/png');
										}
										catch (e) {}
									}
								;

								$('img[data-x-src-cid]', oBody).each(function () {
									fReplaceWithBase64(this);
								});

								Ajax.send('MailSaveMessageAsPdfPlugin', 'GeneratePdfFile', {
									'FileName': this.subject(),
									'Html': oBody.html()
								}, function (oResponse) {
									if (oResponse.Result && oResponse.Result.Actions && oResponse.Result.Actions.download)
									{
										UrlUtils.downloadByUrl(oResponse.Result.Actions.download.url);
									}
									else
									{
										Api.showErrorByCode(oResponse, TextUtils.i18n('MAILSAVEMESSAGEASPDFPLUGIN/ERROR_CREATING_PDF'));
									}
								}, this);
							}
						}
					});
				});
			}
		};
	}
	
	return null;
};


/***/ })

}]);