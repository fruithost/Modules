'use strict';

module.exports = function (oAppData) {
	var
		$ = require('jquery'),
		
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
		
		Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
		Api = require('%PathToCoreWebclientModule%/js/Api.js'),
		App = require('%PathToCoreWebclientModule%/js/App.js')
	;
	
	if (App.isUserNormalOrTenant())
	{
		return {
			start: function (ModulesManager) {
				App.subscribeEvent('MailWebclient::AddMoreSectionCommand', function (fAddMoreSectionCommand) {
					fAddMoreSectionCommand({
						'Text': TextUtils.i18n('%MODULENAME%/ACTION_DOWNLOAD_PDF'),
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

								Ajax.send('%ModuleName%', 'GeneratePdfFile', {
									'FileName': this.subject(),
									'Html': oBody.html()
								}, function (oResponse) {
									if (oResponse.Result && oResponse.Result.Actions && oResponse.Result.Actions.download)
									{
										UrlUtils.downloadByUrl(oResponse.Result.Actions.download.url);
									}
									else
									{
										Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CREATING_PDF'));
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
