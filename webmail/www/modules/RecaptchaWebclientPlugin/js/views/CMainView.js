'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @param {string} sModuleName
 * @param {boolean} bUseLimitCount
 * @constructor
 */
function CMainView(sModuleName, bUseLimitCount)
{
	this.sModuleName = sModuleName;
	this.bShown = false;
	this.recaptchaPlace = ko.observable(null);
	this.recaptchaPlace.subscribe(function () {
		this.ShowRecaptcha();
	}, this);
	this.iAuthErrorCount = ko.observable(0);
	this.bShowRecaptcha = ko.observable(true);

	if (bUseLimitCount)
	{
		this.iAuthErrorCount($.cookie('auth-error') || 0);
		this.iLimitCount = Settings ? Settings.LimitCount : 0;
		//If the user has exceeded the number of authentication attempts - recaptcha will be shown 
		if (this.iAuthErrorCount() < this.iLimitCount)
		{
			this.bShowRecaptcha(false);
		}
		App.subscribeEvent('ReceiveAjaxResponse::after', _.bind(function (oParams) {
			if ((oParams.Request.Module === 'StandardLoginFormWebclient' || oParams.Request.Module === 'MailLoginFormWebclient')
				&& oParams.Request.Method === 'Login'
				&& oParams.Response.Result === false)
			{
				//In case of unsuccessful authentication the counter of unsuccessful attempts will be updated.
				this.iAuthErrorCount($.cookie('auth-error') || 0);
				if (this.iAuthErrorCount() >= this.iLimitCount)
				{
					if (this.bShowRecaptcha())
					{
						window.grecaptcha.reset(this.widgetId);
					}
					else
					{
						this.bShowRecaptcha(true);
					}
				}
			}
		}, this));
	}
	
	App.subscribeEvent('AnonymousUserForm::PopulateFormSubmitParameters', _.bind(function (oParams) {
		if (oParams.Module === sModuleName && oParams.Parameters)
		{
			var aParams = this.getParametersForSubmit();
			_.extend(oParams.Parameters, aParams);
		}
	}, this));
	
	if (!window.grecaptcha)
	{
		window['ShowRecaptcha' + sModuleName] = this.ShowRecaptcha.bind(this);
		$.getScript('https://www.google.com/recaptcha/api.js?onload=ShowRecaptcha' + sModuleName + '&render=explicit');
	}
	else
	{
		this.ShowRecaptcha();
	}
}

CMainView.prototype.ViewTemplate = '%ModuleName%_MainView';

CMainView.prototype.ShowRecaptcha = function ()
{
	if (window.grecaptcha && this.recaptchaPlace())
	{
		if (!this.bShown)
		{
			var
				sKey = Settings ? Settings.PublicKey : ''
			;

			if (sKey === '')
			{
				sKey = "wrong-key";
			}
			this.recaptchaPlace().append('<div id="recaptcha-place-' + this.sModuleName + '"></div>');
			this.widgetId = window.grecaptcha.render('recaptcha-place-' + this.sModuleName, {
				'sitekey': sKey
			});
		}
		else
		{
			window.grecaptcha.reset(this.widgetId);
		}
		this.bShown = true;
	}
};

CMainView.prototype.getParametersForSubmit = function ()
{
	var
		sParamName = Settings.ModuleName + "Token",
		oResult = {}
	;

	oResult[sParamName] = window.grecaptcha.getResponse(this.widgetId);
	return oResult;
};

module.exports = CMainView;
