'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js')
;

module.exports = {
	ServerModuleName: 'Mail',
	HashModuleName: 'mail',
	FetchersServerModuleName: 'MtaConnector',
	
	// from Core module
	EnableMultiTenant: false,
	
	// from Mail module
	AllowAddAccounts: false,
	AllowAutoresponder: false,
	AllowAutosaveInDrafts: true,
	AllowDefaultAccountForUser: true,
	AllowEditDomainsInServer: true,
	AllowFetchers: false,
	AllowFilters: false,
	AllowForward: false,
	AllowIdentities: false,
	AllowInsertImage: true,
	AllowMultiAccounts: false,
	AutoSaveIntervalSeconds: 60,
	AllowTemplateFolders: false,
	AllowAlwaysRefreshFolders: false,
	AutocreateMailAccountOnNewUserFirstLogin: false,
	IgnoreImapSubscription: false,
	ImageUploadSizeLimit: 0,
	
	// from MailWebclient module
	AllowAppRegisterMailto: false,
	AllowChangeInputDirection: true,
	AllowExpandFolders: false,
	AllowSpamFolder: true,
	AllowAddNewFolderOnMainScreen: false,
	ComposeToolbarOrder: ['back', 'send', 'save', 'importance', 'MailSensitivity', 'confirmation', 'OpenPgp'],
	DefaultFontName: 'Tahoma',
	DefaultFontSize: 3,
	JoinReplyPrefixes: true,
	MailsPerPage: 20,
	MaxMessagesBodiesSizeToPrefetch: 50000,
	MessageBodyTruncationThreshold: 650000, // in bytes
	ShowEmailAsTabName: true,
	AllowShowMessagesCountInFolderList: false,
	showMessagesCountInFolderList: ko.observable(false),
	AllowSearchMessagesBySubject: false,
	PrefixesToRemoveBeforeSearchMessagesBySubject: [],
	AllowHorizontalLayout: false,
	HorizontalLayout: false,
	HorizontalLayoutByDefault: false,
	
	userMailAccountsCount: ko.observable(0),
	mailAccountsEmails: ko.observableArray([]),
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var
			oCoreDataSection = oAppData['Core'],
			oAppDataMailSection = oAppData[this.ServerModuleName],
			oAppDataMailWebclientSection = oAppData['%ModuleName%'],
			oAppDataFetchersSection = oAppData[this.FetchersServerModuleName]
		;
		
		if (!_.isEmpty(oCoreDataSection))
		{
			this.EnableMultiTenant = Types.pBool(oCoreDataSection.EnableMultiTenant, this.EnableMultiTenant);
		}
		
		if (!_.isEmpty(oAppDataMailSection))
		{
			this.AllowAddAccounts = Types.pBool(oAppDataMailSection.AllowAddAccounts, this.AllowAddAccounts);
			this.AllowAutoresponder = Types.pBool(oAppDataMailSection.AllowAutoresponder, this.AllowAutoresponder);
			this.AllowAutosaveInDrafts = Types.pBool(oAppDataMailSection.AllowAutosaveInDrafts, this.AllowAutosaveInDrafts);
			this.AllowDefaultAccountForUser = Types.pBool(oAppDataMailSection.AllowDefaultAccountForUser, this.AllowDefaultAccountForUser);
			this.AllowEditDomainsInServer = Types.pBool(oAppDataMailSection.AllowEditDomainsInServer, this.AllowEditDomainsInServer);
			this.AllowFilters = Types.pBool(oAppDataMailSection.AllowFilters, this.AllowFilters);
			this.AllowForward = Types.pBool(oAppDataMailSection.AllowForward, this.AllowForward);
			this.AllowIdentities = Types.pBool(oAppDataMailSection.AllowIdentities, this.AllowIdentities);
			this.AllowInsertImage = Types.pBool(oAppDataMailSection.AllowInsertImage, this.AllowInsertImage);
			this.AllowMultiAccounts = Types.pBool(oAppDataMailSection.AllowMultiAccounts, this.AllowMultiAccounts);
			this.AutoSaveIntervalSeconds = Types.pNonNegativeInt(oAppDataMailSection.AutoSaveIntervalSeconds, this.AutoSaveIntervalSeconds);
			this.AllowTemplateFolders = Types.pBool(oAppDataMailSection.AllowTemplateFolders, this.AllowTemplateFolders);
			this.AllowAlwaysRefreshFolders = Types.pBool(oAppDataMailSection.AllowAlwaysRefreshFolders, this.AllowAlwaysRefreshFolders);
			this.AutocreateMailAccountOnNewUserFirstLogin = Types.pBool(oAppDataMailSection.AutocreateMailAccountOnNewUserFirstLogin, this.AutocreateMailAccountOnNewUserFirstLogin);
			this.IgnoreImapSubscription = Types.pBool(oAppDataMailSection.IgnoreImapSubscription, this.IgnoreImapSubscription);
			this.ImageUploadSizeLimit = Types.pNonNegativeInt(oAppDataMailSection.ImageUploadSizeLimit, this.ImageUploadSizeLimit);
			window.Enums.SmtpAuthType = Types.pObject(oAppDataMailSection.SmtpAuthType);
		}
			
		if (!_.isEmpty(oAppDataMailWebclientSection))
		{
			this.AllowAppRegisterMailto = Types.pBool(oAppDataMailWebclientSection.AllowAppRegisterMailto, this.AllowAppRegisterMailto);
			this.AllowChangeInputDirection = Types.pBool(oAppDataMailWebclientSection.AllowChangeInputDirection, this.AllowChangeInputDirection);
			this.AllowExpandFolders = Types.pBool(oAppDataMailWebclientSection.AllowExpandFolders, this.AllowExpandFolders);
			this.AllowSpamFolder = Types.pBool(oAppDataMailWebclientSection.AllowSpamFolder, this.AllowSpamFolder);
			this.AllowAddNewFolderOnMainScreen = Types.pBool(oAppDataMailWebclientSection.AllowAddNewFolderOnMainScreen, this.AllowAddNewFolderOnMainScreen);
			this.ComposeToolbarOrder = Types.pArray(oAppDataMailWebclientSection.ComposeToolbarOrder, this.ComposeToolbarOrder);
			this.DefaultFontName = Types.pString(oAppDataMailWebclientSection.DefaultFontName, this.DefaultFontName);
			this.DefaultFontSize = Types.pPositiveInt(oAppDataMailWebclientSection.DefaultFontSize, this.DefaultFontSize);
			this.JoinReplyPrefixes = Types.pBool(oAppDataMailWebclientSection.JoinReplyPrefixes, this.JoinReplyPrefixes);
			this.MailsPerPage = Types.pPositiveInt(oAppDataMailWebclientSection.MailsPerPage, this.MailsPerPage);
			this.MaxMessagesBodiesSizeToPrefetch = Types.pNonNegativeInt(oAppDataMailWebclientSection.MaxMessagesBodiesSizeToPrefetch, this.MaxMessagesBodiesSizeToPrefetch);
			this.MessageBodyTruncationThreshold = Types.pNonNegativeInt(oAppDataMailWebclientSection.MessageBodyTruncationThreshold, this.MessageBodyTruncationThreshold);
			this.ShowEmailAsTabName = Types.pBool(oAppDataMailWebclientSection.ShowEmailAsTabName, this.ShowEmailAsTabName);
			this.AllowShowMessagesCountInFolderList = Types.pBool(oAppDataMailWebclientSection.AllowShowMessagesCountInFolderList, this.AllowShowMessagesCountInFolderList);
			this.showMessagesCountInFolderList(Types.pBool(oAppDataMailWebclientSection.ShowMessagesCountInFolderList, this.showMessagesCountInFolderList()));
			this.AllowSearchMessagesBySubject = Types.pBool(oAppDataMailWebclientSection.AllowSearchMessagesBySubject, this.AllowSearchMessagesBySubject);
			this.PrefixesToRemoveBeforeSearchMessagesBySubject = Types.pArray(oAppDataMailWebclientSection.PrefixesToRemoveBeforeSearchMessagesBySubject, this.PrefixesToRemoveBeforeSearchMessagesBySubject);
			this.AllowHorizontalLayout = Types.pBool(oAppDataMailWebclientSection.AllowHorizontalLayout, this.AllowHorizontalLayout);
			this.HorizontalLayout = this.AllowHorizontalLayout && Types.pBool(oAppDataMailWebclientSection.HorizontalLayout, this.HorizontalLayout);
			this.HorizontalLayoutByDefault = this.AllowHorizontalLayout && Types.pBool(oAppDataMailWebclientSection.HorizontalLayoutByDefault, this.HorizontalLayoutByDefault);
		}
		
		if (!_.isEmpty(oAppDataFetchersSection))
		{
			this.AllowFetchers = Types.pBool(oAppDataFetchersSection.AllowFetchers, this.AllowFetchers);
		}
		
		App.registerUserAccountsCount(this.userMailAccountsCount);
		App.registerAccountsWithPass(this.mailAccountsEmails);
	},
	
	/**
	 * Updates new settings values after saving on server.
	 * 
	 * @param {number} iMailsPerPage
	 * @param {boolean} bAllowAutosaveInDrafts
	 * @param {boolean} bAllowChangeInputDirection
	 * @param {boolean} bShowMessagesCountInFolderList
	 */
	update: function (iMailsPerPage, bAllowAutosaveInDrafts, bAllowChangeInputDirection, bShowMessagesCountInFolderList)
	{
		this.AllowAutosaveInDrafts = Types.pBool(bAllowAutosaveInDrafts, this.AllowAutosaveInDrafts);
		
		this.AllowChangeInputDirection = Types.pBool(bAllowChangeInputDirection, this.AllowChangeInputDirection);
		this.MailsPerPage = Types.pPositiveInt(iMailsPerPage, this.MailsPerPage);
		this.showMessagesCountInFolderList(Types.pBool(bShowMessagesCountInFolderList, this.showMessagesCountInFolderList()));
	},
	
	/**
	 * Updates new admin settings values after saving on server.
	 * 
	 * @param {boolean} bAutocreateMailAccountOnNewUserFirstLogin
	 * @param {boolean} bAllowAddAccounts
	 * @param {boolean} bHorizontalLayoutByDefault
	 */
	updateAdmin: function (bAutocreateMailAccountOnNewUserFirstLogin, bAllowAddAccounts, bHorizontalLayoutByDefault)
	{
		this.AutocreateMailAccountOnNewUserFirstLogin = Types.pBool(bAutocreateMailAccountOnNewUserFirstLogin, this.AutocreateMailAccountOnNewUserFirstLogin);
		this.AllowAddAccounts = Types.pBool(bAllowAddAccounts, this.AllowAddAccounts);
		this.HorizontalLayoutByDefault = Types.pBool(bHorizontalLayoutByDefault, this.HorizontalLayoutByDefault);
	},
	
	disableEditDomainsInServer: function ()
	{
		this.AllowEditDomainsInServer = false;
	}
};
