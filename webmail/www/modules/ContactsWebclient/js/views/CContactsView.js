'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	FileSaver = require('%PathToCoreWebclientModule%/js/vendors/FileSaver.js'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CJua = require('%PathToCoreWebclientModule%/js/CJua.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	ContactsCache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CContactListItemModel = require('modules/%ModuleName%/js/models/CContactListItemModel.js'),
	CContactModel = require('modules/%ModuleName%/js/models/CContactModel.js'),
	CGroupModel = require('modules/%ModuleName%/js/models/CGroupModel.js'),
	
	CImportView = require('modules/%ModuleName%/js/views/CImportView.js'),
	
	Enums = window.Enums
;

/**
 * @constructor
 */
function CContactsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
	
	this.contactCount = ko.observable(0);
	this.uploaderArea = ko.observable(null);
	this.dragActive = ko.observable(false);
	this.bDragActiveComp = ko.computed(function () {
		return this.dragActive();
	}, this);
	
	this.sImportContactsLink = Settings.ImportContactsLink;
	
	this.loadingList = ko.observable(false);
	this.preLoadingList = ko.observable(false);
	this.loadingList.subscribe(function (bLoading) {
		this.preLoadingList(bLoading);
	}, this);
	this.loadingViewPane = ko.observable(false);
	
	this.showPersonalContacts = ko.observable(false);
	this.showTeamContacts = ko.observable(false);
	this.showSharedToAllContacts = ko.observable(false);
	
	this.showAllContacts = ko.computed(function () {
		return 1 < [this.showPersonalContacts() ? '1' : '',
			this.showTeamContacts() ? '1' : '',
			this.showSharedToAllContacts() ? '1' : ''
		].join('').length;
	}, this);
	
	this.recivedAnimPersonal = ko.observable(false).extend({'autoResetToFalse': 500});
	this.recivedAnimShared = ko.observable(false).extend({'autoResetToFalse': 500});
	this.recivedAnimTeam = ko.observable(false).extend({'autoResetToFalse': 500});
	
	this.isTeamStorageSelected = ko.observable(false);
	this.isNotTeamStorageSelected = ko.observable(false);
	this.disableDropToPersonal = ko.observable(false);
	this.selectedStorageValue = ko.observable('');
	this.selectedStorage = ko.computed({
		'read': function () {
			return this.selectedStorageValue();
		},
		'write': function (sValue) {
			if (sValue !== '')
			{
				this.selectedStorageValue(($.inArray(sValue, Settings.Storages) !== -1) ? sValue : Settings.DefaultStorage);
				if (this.selectedStorageValue() !== 'group')
				{
					this.selectedGroupInList(null);
					this.selectedItem(null);
					this.selector.listCheckedOrSelected(false);
					this.currentGroupUUID('');
				}
				this.isTeamStorageSelected(this.selectedStorageValue() === 'team');
				this.isNotTeamStorageSelected(this.selectedStorageValue() !== 'team');
				this.disableDropToPersonal(this.selectedStorageValue() !== 'shared');
			}
		},
		'owner': this
	});
	
	this.selectedGroupInList = ko.observable(null);
	
	this.selectedGroupInList.subscribe(function () {
		var oPrev = this.selectedGroupInList();
		if (oPrev)
		{
			oPrev.selected(false);
		}
	}, this, 'beforeChange');
	
	this.selectedGroupInList.subscribe(function (oGroup) {
		if (oGroup && this.showPersonalContacts())
		{
			oGroup.selected(true);
			this.selectedStorage('group');
			this.requestContactList();
		}
	}, this);
	
	this.selectedGroup = ko.observable(null);
	this.selectedContact = ko.observable(null);
	this.selectedGroupEmails = ko.observableArray([]);
	
	this.currentGroupUUID = ko.observable('');
	
	this.oContactModel = new CContactModel();
	this.oGroupModel = new CGroupModel();
	
	this.oImportView = new CImportView(this);
	
	this.selectedOldItem = ko.observable(null);
	this.selectedItem = ko.computed({
		'read': function () {
			return this.selectedContact() || this.selectedGroup() || null;
		},
		'write': function (oItem) {
			if (oItem instanceof CContactModel)
			{
				this.selectedGroup(null);
				this.selectedContact(oItem);
			}
			else if (oItem instanceof CGroupModel)
			{
				this.selectedContact(null);
				this.selectedGroup(oItem);
				this.currentGroupUUID(oItem.uuid());
			}
			else
			{
				this.selectedGroup(null);
				this.selectedContact(null);
			}
			
			this.loadingViewPane(false);
		},
		'owner': this
	});
	
	this.collection = ko.observableArray([]);
	this.contactUidForRequest = ko.observable('');
	this.collection.subscribe(function () {
		if (this.collection().length > 0 && this.contactUidForRequest() !== '')
		{
			this.requestContact(this.contactUidForRequest());
			this.contactUidForRequest('');
		}
	}, this);
	
	this.isSearchFocused = ko.observable(false);
	this.searchInput = ko.observable('');
	this.search = ko.observable('');
	
	this.groupUidForRequest = ko.observable('');
	this.groupFullCollection = ko.observableArray([]);
	this.groupFullCollection.subscribe(function () {
		if (this.groupUidForRequest())
		{
			this.onViewGroupClick(this.groupUidForRequest());
		}
	}, this);
	
	this.selectedContact.subscribe(function (oContact) {
		if (oContact)
		{
			var aGroupUUIDs = oContact.groups();
			_.each(this.groupFullCollection(), function (oItem) {
				oItem.checked(oItem && 0 <= $.inArray(oItem.UUID(), aGroupUUIDs));
			});
		}
	}, this);
	
	this.pageSwitcherLocked = ko.observable(false);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ContactsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function () {
		if (!this.pageSwitcherLocked())
		{
			this.changeRouting();
		}
	}, this);
	this.currentPage = ko.observable(1);
	
	this.search.subscribe(function (sValue) {
		this.searchInput(sValue);
	}, this);
	
	this.searchSubmitCommand = Utils.createCommand(this, function () {
		this.changeRouting({ Search: this.searchInput() });
	});
	
	this.searchMessagesInInbox = ModulesManager.run('MailWebclient', 'getSearchMessagesInInbox');
	this.bAllowSearchMessagesInInbox = _.isFunction(this.searchMessagesInInbox);
	this.composeMessageToAddresses = ModulesManager.run('MailWebclient', 'getComposeMessageToAddresses');
	this.bAllowComposeMessageToAddresses = _.isFunction(this.composeMessageToAddresses);
	this.selector = new CSelector(this.collection, _.bind(this.viewContact, this), _.bind(this.deleteContact, this), this.bAllowComposeMessageToAddresses ? _.bind(this.composeMessageToContact, this) : null);
	
	this.checkAll = this.selector.koCheckAll();
	this.checkAllIncomplite = this.selector.koCheckAllIncomplete();
	
	this.isCheckedOrSelected = ko.computed(function () {
		return 0 < this.selector.listCheckedOrSelected().length;
	}, this);
	this.isEnableAddContacts = this.isCheckedOrSelected;
	this.isEnableRemoveContactsFromGroup = this.isCheckedOrSelected;
	this.isEnableDeleting = this.isCheckedOrSelected;
	this.isEnableSharing = this.isCheckedOrSelected;
	this.visibleShareCommand = ko.computed(function () {
		return this.showPersonalContacts() && this.showSharedToAllContacts() && this.selectedStorage() === 'personal';
	}, this);
	this.visibleUnshareCommand = ko.computed(function () {
		return this.showPersonalContacts() && this.showSharedToAllContacts() && this.selectedStorage() === 'shared';
	}, this);
	
	this.isExactlyOneContactSelected = ko.computed(function () {
		return 1 === this.selector.listCheckedOrSelected().length;
	}, this);
	
	this.isSaving = ko.observable(false);
	
	this.newContactCommand = Utils.createCommand(this, this.executeNewContact, this.isNotTeamStorageSelected);
	this.newGroupCommand = Utils.createCommand(this, this.executeNewGroup);
	this.addContactsCommand = Utils.createCommand(this, function () {}, this.isEnableAddContacts);
	this.deleteCommand = Utils.createCommand(this, this.deleteContact, this.isEnableDeleting);
	this.selectedCount = ko.computed(function () {
		var
			aChecked = _.filter(this.selector.listCheckedOrSelected(), function (oItem) {
				return !oItem.ReadOnly();
			});
		return aChecked.length;
	}, this);
	this.shareCommand = Utils.createCommand(this, this.executeShare, this.isEnableSharing);
	this.removeFromGroupCommand = Utils.createCommand(this, this.executeRemoveFromGroup, this.isEnableRemoveContactsFromGroup);
	this.importCommand = Utils.createCommand(this, this.executeImport);
	this.saveCommand = Utils.createCommand(this, this.executeSave);
	this.updateSharedToAllCommand = Utils.createCommand(this, this.executeUpdateSharedToAll, this.isExactlyOneContactSelected);
	this.composeMessageCommand = Utils.createCommand(this, this.composeMessage, this.isCheckedOrSelected);
	
	this.selector.listCheckedOrSelected.subscribe(function (aList) {
		this.oGroupModel.newContactsInGroupCount(aList.length);
	}, this);
	
	this.isSearch = ko.computed(function () {
		return this.search() !== '';
	}, this);
	this.isEmptyList = ko.computed(function () {
		return 0 === this.collection().length;
	}, this);
	
	this.searchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.search()
		});
	}, this);
	
	this.visibleDragNDropToGroupText = ko.computed(function () {
		return !App.isMobile() && this.selectedStorage() === 'group';
	}, this);
	this.selectedPanel = ko.observable(Enums.MobilePanel.Items);
	
	this.enableExport = ko.computed(function () {
		return this.contactCount() > 0;
	}, this);
	this.aExportData = [];
	_.each(Settings.ImportExportFormats, function (sFormat) {
		if (Types.isNonEmptyString(sFormat))
		{
			this.aExportData.push({
				'css': sFormat.toLowerCase(),
				'text': TextUtils.i18n('%MODULENAME%/ACTION_EXPORT_AS', {'FORMAT': sFormat.toUpperCase()}),
				'command': Utils.createCommand(this, function () { this.executeExport(sFormat); }, this.enableExport)
			});
		}
	}, this);
	this.isPersonalStorageSelected = ko.computed(function () {
		return this.selectedStorage() === 'personal';
	}, this);
	this.visibleImportExport = ko.computed(function () {
		return this.aExportData.length > 0;
	}, this);
	
	this.infoCreateOrImport = this.getCreateOrImportInfo();
	this.listChanged = ko.computed(function () {
		return [
			this.selectedStorage(),
			this.currentGroupUUID(),
			this.search(),
			this.oPageSwitcher.currentPage(),
			this.oPageSwitcher.perPage()
		];
	}, this);
	
	this.bRefreshContactList = false;
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CContactsView.prototype, CAbstractScreenView.prototype);

CContactsView.prototype.ViewTemplate = '%ModuleName%_ContactsScreenView';
CContactsView.prototype.ViewConstructorName = 'CContactsView';

CContactsView.prototype.getFormatDependentText = function (sLangConstantName)
{
	switch (Settings.ImportExportFormats.length)
	{
		case 0:
			return '';
		case 1:
			return TextUtils.i18n('%MODULENAME%/' + sLangConstantName + '_SINGLE_EXT', {
				'EXTENSION': Settings.ImportExportFormats[0].toUpperCase()
			});
		default:
			return TextUtils.i18n('%MODULENAME%/' + sLangConstantName + '_PLURAL_EXT', {
				'EXTENSIONS': _.initial(Settings.ImportExportFormats).join(', ').toUpperCase(),
				'LASTEXTENSION': _.last(Settings.ImportExportFormats).toUpperCase()
			});
	}
};

CContactsView.prototype.getCreateOrImportInfo = function ()
{
	var sOrImportInfo = this.getFormatDependentText('INFO_OR_IMPORT');
	return TextUtils.i18n('%MODULENAME%/INFO_CREATE') + (sOrImportInfo === '' ? '' : ' ' + sOrImportInfo) + '.';
};

/**
 * @param {Object} oData
 */
CContactsView.prototype.executeSave = function (oData)
{
	var
		oContact = {},
		aList = [],
		oGroup
	;

	if (oData === this.selectedItem() && this.selectedItem().canBeSave())
	{
		if (oData instanceof CContactModel && !oData.readOnly())
		{
			_.each(this.groupFullCollection(), function (oItem) {
				if (oItem && oItem.checked())
				{
					aList.push(oItem.UUID());
				}
			});
			
			oData.groups(aList);
			
			if (this.selectedItem())
			{
				ContactsCache.clearInfoAboutEmail(this.selectedItem().email());
			}

			oContact = oData.toObject();

			if (this.selectedStorage() !== 'personal' && oContact.Storage === 'personal')
			{
				this.recivedAnimPersonal(true);
			}
			if (this.selectedStorage() !== 'team' && oContact.Storage === 'team')
			{
				this.recivedAnimTeam(true);
			}

			if (oData.isNew())
			{
				if (this.selectedStorage() === 'all' || this.selectedStorage() === 'group')
				{
					// there are no real storages with name 'all' or 'group' on server side
					oContact.Storage = 'personal';
				}
				else
				{
					// server subscribers need to know if contact should be in 'personal' or 'shared' storage
					oContact.Storage = this.selectedStorage();
				}
				this.isSaving(true);

				oContact.ViewEmail = oData.email();
				var
					oParams = {
						Contact: oContact,
						Callback: function (result) {
							if (result.Error)
							{
								Screens.showError(result.ErrorMessage);
								this.isSaving(false);
							}
							else
							{
								Ajax.send('CreateContact', { Contact: oContact }, this.onCreateContactResponse, this);
							}
						}.bind(this)
					}
				;
				if (!App.broadcastEvent('%ModuleName%::beforeCreateContactRequest', oParams))
				{
					Ajax.send('CreateContact', { Contact: oContact }, this.onCreateContactResponse, this);
				}
			}
			else
			{
				this.isSaving(true);

				oContact.ViewEmail = oData.email();
				var
					oParams = {
						Contact: oContact,
						Callback: function (result) {
							if (result.Error)
							{
								Screens.showError(result.ErrorMessage);
								this.isSaving(false);
							}
							else
							{
								Ajax.send('UpdateContact', { Contact: oContact }, this.onUpdateContactResponse, this);
							}
						}.bind(this)
					}
				;
				if (!App.broadcastEvent('%ModuleName%::beforeUpdateContactRequest', oParams))
				{
					Ajax.send('UpdateContact', { Contact: oContact }, this.onUpdateContactResponse, this);
				}
			}
		}
		else if (oData instanceof CGroupModel && !oData.readOnly())
		{
			var aContactUUIDs = _.map(this.selector.listCheckedOrSelected(), function (oItem) { return oItem.UUID(); });
			this.isSaving(true);

			oGroup =  oData.toObject(aContactUUIDs);
			if (!oData.isNew())
			{
				oGroup.Contacts = null;
			}
			Ajax.send(oData.isNew() ? 'CreateGroup' : 'UpdateGroup', {'Group': oGroup}, this.onCreateGroupResponse, this);
		}
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_EMAIL_OR_NAME_BLANK'));
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onCreateContactResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	if (oResponse.Result)
	{
		this.requestContactList();
		this.viewContact(oResponse.Result.UUID);
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_CONTACT_SUCCESSFULLY_ADDED'));
		App.broadcastEvent('%ModuleName%::createContactResponse', [oResponse.Result]);
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CREATE_CONTACT'));
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onUpdateContactResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	if (oResponse.Result)
	{
		if (this.selectedContact() && this.selectedContact().edited())
		{
			this.selectedContact().edited(false);
		}
		this.requestContactList();
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_CONTACT_SUCCESSFULLY_UPDATED'));
		App.broadcastEvent('%ModuleName%::updateContactResponse', [oResponse.Result]);
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_UPDATE_CONTACT'));
	}
};

CContactsView.prototype.changeRouting = function (oParams, bReplace)
{
	oParams = oParams || {};
	var
		sStorage = oParams.Storage === undefined ? this.selectedStorage() : oParams.Storage,
		sGroupUUID = oParams.GroupUUID === undefined ? this.currentGroupUUID() : oParams.GroupUUID,
		sSearch = oParams.Search === undefined ? this.search() : oParams.Search,
		iPage = oParams.Page === undefined ? this.oPageSwitcher.currentPage() : oParams.Page,
		sContactUUID = oParams.ContactUUID === undefined ? '' : oParams.ContactUUID,
		sAction = oParams.Action === undefined ? '' : oParams.Action
	;
	
	if (bReplace)
	{
		Routing.replaceHash(LinksUtils.getContacts(sStorage, sGroupUUID, sSearch, iPage, sContactUUID, sAction));
	}
	else
	{
		Routing.setHash(LinksUtils.getContacts(sStorage, sGroupUUID, sSearch, iPage, sContactUUID, sAction));
	}
};

CContactsView.prototype.executeNewContact = function ()
{
	if (this.showPersonalContacts())
	{
		var sGroupUUID = (this.selectedStorage() === 'group') ? this.currentGroupUUID() : '';
		this.changeRouting({ GroupUUID: sGroupUUID, Action: 'create-contact' });
	}
};

CContactsView.prototype.executeNewGroup = function ()
{
	var sGroupUUID = (this.selectedStorage() === 'group') ? this.currentGroupUUID() : '';
	if (this.selector.itemSelected() instanceof CContactListItemModel)
	{
		this.selector.itemSelected().checked(true);
	}
	this.changeRouting({GroupUUID: sGroupUUID, Action: 'create-group' });
};

CContactsView.prototype.deleteContact = function ()
{
	var sStorage = this.selectedStorage();
	if (sStorage === 'personal' || sStorage === 'shared')
	{
		var
			aChecked = _.filter(this.selector.listCheckedOrSelected(), function (oItem) {
				return !oItem.ReadOnly();
			}),
			iCount = aChecked.length,
			sConfirmText = TextUtils.i18n('%MODULENAME%/CONFIRM_DELETE_CONTACTS_PLURAL', {}, null, iCount),
			fDeleteContacts = _.bind(function (bResult) {
				if (bResult)
				{
					this.deleteContacts(aChecked);
				}
			}, this)
			;

		Popups.showPopup(ConfirmPopup, [sConfirmText, fDeleteContacts, '', TextUtils.i18n('COREWEBCLIENT/ACTION_DELETE')]);
	}
	else if (sStorage === 'group')
	{
		this.removeFromGroupCommand();
	}
};

CContactsView.prototype.deleteContacts = function (aChecked)
{
	var
		self = this,
		oMainContact = this.selectedContact(),
		aContactUUIDs = _.map(aChecked, function (oItem) {
			return oItem.UUID();
		})
	;

	if (0 < aContactUUIDs.length)
	{
		this.preLoadingList(true);

		_.each(aChecked, function (oContact) {
			if (oContact)
			{
				ContactsCache.clearInfoAboutEmail(oContact.Email());

				if (oMainContact && !oContact.IsGroup() && !oContact.ReadOnly() && !oMainContact.readOnly() && oMainContact.uuid() === oContact.UUID())
				{
					oMainContact = null;
					this.selectedContact(null);
				}
			}
		}, this);

		_.each(this.collection(), function (oContact) {
			if (-1 < $.inArray(oContact, aChecked))
			{
				oContact.deleted(true);
			}
		});

		_.delay(function () {
			self.collection.remove(function (oItem) {
				return oItem.deleted();
			});
		}, 500);

		Ajax.send('DeleteContacts', { 'Storage': this.selectedStorage(), 'UUIDs': aContactUUIDs }, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_CONTACTS'));
			}
			App.broadcastEvent('%ModuleName%::deleteContactsResponse', [oResponse.Result]);			
			this.requestContactList();
		}, this);
		
		ContactsCache.markVcardsNonexistentByUid(aContactUUIDs);
	}
};

CContactsView.prototype.executeRemoveFromGroup = function ()
{
	var
		self = this,
		oGroup = this.selectedGroupInList(),
		aChecked = this.selector.listCheckedOrSelected(),
		aContactUUIDs = _.map(aChecked, function (oItem) {
			return oItem.UUID();
		})
	;

	aContactUUIDs = _.compact(aContactUUIDs);

	if (oGroup && 0 < aContactUUIDs.length)
	{
		this.preLoadingList(true);

		_.each(this.collection(), function (oContact) {
			if (-1 < $.inArray(oContact, aChecked))
			{
				oContact.deleted(true);
			}
		});

		_.delay(function () {
			self.collection.remove(function (oItem) {
				return oItem.deleted();
			});
		}, 500);

		Ajax.send('RemoveContactsFromGroup', {
			'GroupUUID': oGroup.UUID(),
			'ContactUUIDs': aContactUUIDs
		}, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse);
			}
			this.requestContactList();
		}, this);
	}
};

CContactsView.prototype.executeImport = function ()
{
	this.changeRouting({Storage: 'personal', GroupUUID: '', Search: '', Page: 1, Action: 'import'});
};

CContactsView.prototype.executeExport = function (sFormat)
{
	var
		aContactUUIDs = _.map(this.selector.listCheckedOrSelected(), function (oContact) {
			return oContact.sUUID;
		}),
		sStorage = this.selectedStorage()
	;
	if (sStorage === 'group')
	{
		sStorage = 'all';
	}
	Ajax.send('Export', {
		'Format': sFormat,
		'Storage': sStorage,
		'GroupUUID': this.currentGroupUUID(),
		'ContactUUIDs': aContactUUIDs
	}, function (oResponse) {
		var oBlob = new Blob([oResponse.ResponseText], {'type': 'text/plain;charset=utf-8'});
		FileSaver.saveAs(oBlob, 'export.' + sFormat, true);
	}, this, { Format: 'Raw' });
};

CContactsView.prototype.executeCancel = function ()
{
	var oData = this.selectedItem();
	
	if (oData)
	{
		if (oData instanceof CContactModel && !oData.readOnly())
		{
			if (oData.isNew())
			{
				Routing.setPreviousHash();
			}
			else if (oData.edited())
			{
				oData.edited(false);
				this.requestContact(oData.uuid());
			}
			else
			{
				this.changeRouting();
			}
		}
		else if (oData instanceof CGroupModel && !oData.readOnly())
		{
			if (oData.isNew())
			{
				Routing.setPreviousHash();
			}
			else if (oData.edited())
			{
				this.selectedItem(this.selectedOldItem());
				oData.edited(false);
			}
			else
			{
				this.changeRouting();
			}
		}
		else if (this.oImportView.visibility())
		{
			Routing.setPreviousHash();
		}
	}
};

/**
 * @param {Object} oGroup
 * @param {Array} aContactUUIDs
 */
CContactsView.prototype.executeAddContactsToGroup = function (oGroup, aContactUUIDs)
{
	if (oGroup && _.isArray(aContactUUIDs) && 0 < aContactUUIDs.length)
	{
		oGroup.recivedAnim(true);

		this.executeAddContactsToGroupUUID(oGroup.UUID(), aContactUUIDs);
	}
};

/**
 * @param {string} sGroupUUID
 * @param {Array} aContactUUIDs
 */
CContactsView.prototype.executeAddContactsToGroupUUID = function (sGroupUUID, aContactUUIDs)
{
	if (sGroupUUID && _.isArray(aContactUUIDs) && 0 < aContactUUIDs.length)
	{
		Ajax.send('AddContactsToGroup', {
			'GroupUUID': sGroupUUID,
			'ContactUUIDs': aContactUUIDs
		}, this.onAddContactsToGroupResponse, this);
	}
};

CContactsView.prototype.onAddContactsToGroupResponse = function (oResponse)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse);
	}
	this.requestContactList();
	if (this.selector.itemSelected())
	{
		this.requestContact(this.selector.itemSelected().UUID());
	}
};

/**
 * @param {Object} oGroup
 */
CContactsView.prototype.executeAddSelectedContactsToGroup = function (oGroup)
{
	var
		aList = this.selector.listCheckedOrSelected(),
		aContactUUIDs = []
	;

	if (oGroup && _.isArray(aList) && 0 < aList.length)
	{
		_.each(aList, function (oItem) {
			if (oItem && !oItem.IsGroup())
			{
				aContactUUIDs.push(oItem.UUID());
			}
		}, this);
	}

	this.executeAddContactsToGroup(oGroup, aContactUUIDs);
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.groupsInContactView = function (oContact)
{
	var
		aResult = [],
		aGroupUUIDs = []
	;
	
	if (oContact && !oContact.groupsIsEmpty())
	{
		aGroupUUIDs = oContact.groups();
		aResult = _.filter(this.groupFullCollection(), function (oItem) {
			return 0 <= $.inArray(oItem.UUID(), aGroupUUIDs);
		});
	}
	
	return aResult;
};

CContactsView.prototype.onShow = function ()
{
	this.selector.useKeyboardKeys(true);
	
	this.oPageSwitcher.show();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(true);
	}
	
	this.bRefreshContactList = true;
};

CContactsView.prototype.onHide = function ()
{
	this.selector.listCheckedOrSelected(false);
	this.selector.useKeyboardKeys(false);
	this.selectedItem(null);
	
	this.oPageSwitcher.hide();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(false);
	}
};

CContactsView.prototype.onBind = function ()
{
	this.selector.initOnApplyBindings(
		'.contact_sub_list .item',
		'.contact_sub_list .selected.item',
		'.contact_sub_list .item .custom_checkbox',
		$('.contact_list', this.$viewDom),
		$('.contact_list_scroll.scroll-inner', this.$viewDom)
	);

	var self = this;

	this.$viewDom.on('click', '.content .item.add_to .dropdown_helper .item', function () {

		if ($(this).hasClass('new-group'))
		{
			self.executeNewGroup();
		}
		else
		{
			self.executeAddSelectedContactsToGroup(ko.dataFor(this));
		}
	});

	this.showPersonalContacts(-1 !== $.inArray('personal', Settings.Storages));
	this.showTeamContacts(-1 !== $.inArray('team', Settings.Storages));
	this.showSharedToAllContacts(-1 !== $.inArray('shared', Settings.Storages));
	
	this.selectedStorage(this.selectedStorage());
	
	this.oImportView.onBind();
	this.requestGroupFullList();

	if (!App.isMobile())
	{
		this.hotKeysBind();
	}

	this.initUploader();
};

CContactsView.prototype.hotKeysBind = function ()
{
	var bFirstContactFlag = false;

	$(document).on('keydown', _.bind(function(ev) {
		var
			nKey = ev.keyCode,
			oFirstContact = this.collection()[0],
			bListIsFocused = this.isSearchFocused(),
			bFirstContactSelected = false
		;

		if (this.shown() && !Utils.isTextFieldFocused() && !bListIsFocused && ev && nKey === Enums.Key.s)
		{
			ev.preventDefault();
			this.searchFocus();
		}

		else if (oFirstContact)
		{
			bFirstContactSelected = oFirstContact.selected();

			if (oFirstContact && bListIsFocused && ev && nKey === Enums.Key.Down)
			{
				this.isSearchFocused(false);
				this.selector.itemSelected(oFirstContact);

				bFirstContactFlag = true;
			}
			else if (!bListIsFocused && bFirstContactFlag && bFirstContactSelected && ev && nKey === Enums.Key.Up)
			{
				this.isSearchFocused(true);
				this.selector.itemSelected(false);
				
				bFirstContactFlag = false;
			}
			else if (bFirstContactSelected)
			{
				bFirstContactFlag = true;
			}
			else if (!bFirstContactSelected)
			{
				bFirstContactFlag = false;
			}
		}
	}, this));
};

CContactsView.prototype.refreshContactsAndGroups = function ()
{
	this.requestContactList();
	this.requestGroupFullList();
};

CContactsView.prototype.requestContactList = function ()
{
	var
		sGroupUUID = this.selectedStorage() === 'group' && this.selectedGroupInList() ? this.selectedGroupInList().UUID() : '',
		sStorage = sGroupUUID !== '' ? 'all' : this.selectedStorage()
	;
	
	this.loadingList(true);
	Ajax.send('GetContacts', {
		'Offset': (this.currentPage() - 1) * Settings.ContactsPerPage,
		'Limit': Settings.ContactsPerPage,
		'SortField': Enums.ContactSortField.Name,
		'Search': this.search(),
		'GroupUUID': sGroupUUID,
		'Storage': sStorage
	}, this.onGetContactsResponse, this);
};

CContactsView.prototype.requestGroupFullList = function ()
{
	Ajax.send('GetGroups', null, this.onGetGroupsResponse, this);
};

/**
 * @param {string} sContactUUID
 */
CContactsView.prototype.requestContact = function (sContactUUID)
{
	this.loadingViewPane(true);
	
	var oItem = _.find(this.collection(), function (oItm) {
		return oItm.UUID() === sContactUUID;
	});
	
	if (oItem)
	{
		this.selector.itemSelected(oItem);
		Ajax.send('GetContact', { 'UUID': oItem.UUID() }, this.onGetContactResponse, this);
	}
	else
	{
		this.contactUidForRequest(sContactUUID);
		this.selector.itemSelected(null);
		this.selectedItem(null);
	}
};

/**
 * @param {Object} oData
 */
CContactsView.prototype.editGroup = function (oData)
{
	var oGroup = new CGroupModel();
	oGroup.populate(oData);
	this.selectedOldItem(oGroup);
	oData.edited(true);
};

/**
 * @param {string} sStorage
 */
CContactsView.prototype.changeGroupType = function (sStorage)
{
	this.changeRouting({ Storage: sStorage, GroupUUID: '' });
};

/**
 * @param {Object} mData
 */
CContactsView.prototype.onViewGroupClick = function (mData)
{
	var sUUID = (typeof mData === 'string') ? mData : mData.UUID();
	this.changeRouting({ Storage: 'group', GroupUUID: sUUID });
};

/**
 * @param {Array} aParams
 */
CContactsView.prototype.onRoute = function (aParams)
{
	var
		oParams = LinksUtils.parseContacts(aParams),
		bGroupOrSearchChanged = this.selectedStorage() !== oParams.Storage || this.currentGroupUUID() !== oParams.GroupUUID || this.search() !== oParams.Search,
		bGroupFound = true,
		bRequestContacts = this.bRefreshContactList
	;
	
	this.bRefreshContactList = false;
	
	this.pageSwitcherLocked(true);
	if (this.oPageSwitcher.perPage() !== Settings.ContactsPerPage)
	{
		bRequestContacts = true;
	}
	if (bGroupOrSearchChanged)
	{
		this.oPageSwitcher.clear();
		this.oPageSwitcher.perPage(Settings.ContactsPerPage);
	}
	else
	{
		this.oPageSwitcher.setPage(oParams.Page, Settings.ContactsPerPage);
	}
	this.pageSwitcherLocked(false);
	if (oParams.Page !== this.oPageSwitcher.currentPage())
	{
		Routing.replaceHash(LinksUtils.getContacts(oParams.Storage, oParams.GroupUUID, oParams.Search, this.oPageSwitcher.currentPage()));
	}
	if (this.currentPage() !== oParams.Page)
	{
		this.currentPage(oParams.Page);
		bRequestContacts = true;
	}
	
	if (this.selectedStorage() !== oParams.Storage && -1 !== $.inArray(oParams.Storage, Settings.Storages) && oParams.Storage !== 'group')
	{
		this.selectedStorage(oParams.Storage);
		bRequestContacts = true;
	}
	else if (oParams.Storage === 'group' && oParams.Action !== 'create-group' && (this.currentGroupUUID() !== oParams.GroupUUID || oParams.ContactUUID === ''))
	{
		bGroupFound = this.viewGroup(oParams.GroupUUID);
		if (bGroupFound)
		{
			bRequestContacts = false;
		}
		else
		{
			Routing.replaceHash(LinksUtils.getContacts());
		}
	}
	
	if (this.search() !== oParams.Search)
	{
		this.search(oParams.Search);
		bRequestContacts = true;
	}
	
	this.contactUidForRequest('');
	
	if (oParams.ContactUUID)
	{
		if (this.collection().length === 0)
		{
			this.contactUidForRequest(oParams.ContactUUID);
		}
		else
		{
			this.requestContact(oParams.ContactUUID);
		}
	}
	else if (this.selectedItem() instanceof CContactModel)
	{
		this.selector.itemSelected(null);
		this.selectedItem(null);
	}

	switch (oParams.Action)
	{
		case 'create-contact':
			var
				oGr = this.selectedGroupInList(),
				oNewContactParams = ContactsCache.getNewContactParams()
			;
			
			this.oContactModel.switchToNew();
			this.oContactModel.groups(oGr ? [oGr.UUID()] : []);
			
			if (oNewContactParams)
			{
				_.each(oNewContactParams, function (sValue, sKey) {
					if (_.isFunction(this.oContactModel[sKey]))
					{
						this.oContactModel[sKey](sValue);
					}
				}, this);
				this.oContactModel.extented(true);
			}
			
			this.selectedItem(this.oContactModel);
			this.selector.itemSelected(null);
			this.oImportView.visibility(false);
			break;
		case 'create-group':
			this.oGroupModel.switchToNew();
			this.selectedItem(this.oGroupModel);
			this.selector.itemSelected(null);
			this.oImportView.visibility(false);
			break;
		case 'import':
			this.selectedItem(null);
			this.oImportView.visibility(true);
			this.selector.itemSelected(null);
			break;
		default:
			if (!oParams.ContactUUID && !oParams.GroupUUID)
			{
				this.selectedItem(null);
				this.selector.itemSelected(null);
			}
			this.oImportView.visibility(false);
			break;
	}
	
	if (bRequestContacts)
	{
		this.requestContactList();
	}
	
	this.isSaving(false);
};

/**
 * @param {string} sGroupUUID
 */
CContactsView.prototype.viewGroup = function (sGroupUUID)
{
	var
		oGroup = _.find(this.groupFullCollection(), function (oItem) {
			return oItem && oItem.UUID() === sGroupUUID;
		})
	;
	
	if (oGroup)
	{
		this.groupUidForRequest('');
		
		this.oGroupModel.clear();
		this.oGroupModel
			.uuid(oGroup.UUID())
			.name(oGroup.Name())
		;
		if (oGroup.IsOrganization())
		{
			this.requestGroup(oGroup);
		}

		this.selectedGroupInList(oGroup);
		this.selectedItem(this.oGroupModel);
		this.selector.itemSelected(null);
		this.selector.listCheckedOrSelected(false);
		
		Ajax.send('GetGroupEvents', { 'UUID': sGroupUUID }, this.onGetGroupEventsResponse, this);
	}
	else
	{
		this.groupUidForRequest(sGroupUUID);
	}
	
	return !!oGroup;
};

/**
 * @param {string} sGroupUUID
 */
CContactsView.prototype.deleteGroup = function (sGroupUUID)
{
	if (sGroupUUID)
	{
		this.groupFullCollection.remove(function (oItem) {
			return oItem && oItem.UUID() === sGroupUUID;
		});
		
		Ajax.send('DeleteGroup', { 'UUID': sGroupUUID }, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse);
			}
			this.requestGroupFullList();
		}, this);

		this.changeGroupType(Settings.DefaultStorage);
	}
};

/**
 * @param {Object} oGroup
 */
CContactsView.prototype.mailGroup = function (oGroup)
{
	if (this.bAllowComposeMessageToAddresses && oGroup)
	{
		Ajax.send('GetContacts', {
			'Storage': 'all',
			'Offset': 0,
			'Limit': 200,
			'SortField': Enums.ContactSortField.Name,
			'GroupUUID': oGroup.uuid()
		}, function (oResponse) {
			var
				aList = oResponse && oResponse.Result && oResponse.Result.List,
				aEmails = Types.isNonEmptyArray(aList) ? _.compact(_.map(aList, function (oRawContactItem) {
					var oContactItem = new CContactListItemModel();
					oContactItem.parse(oRawContactItem);
					return oContactItem.Email() !== '' ? oContactItem.getFullEmail() : '';
				})) : [],
				sEmails = aEmails.join(', ')
			;

			if (sEmails !== '')
			{
				this.composeMessageToAddresses(sEmails);
			}
		}, this);
	}
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.dragAndDropHelper = function (oContact)
{
	if (oContact)
	{
		oContact.checked(true);
	}

	var
		oSelected = this.selector.itemSelected(),
		oHelper = Utils.draggableItems(),
		nCount = this.selector.listCheckedOrSelected().length,
		aUids = 0 < nCount ? _.map(this.selector.listCheckedOrSelected(), function (oItem) {
			return oItem.UUID();
		}) : []
	;

	if (oSelected && !oSelected.checked())
	{
		oSelected.checked(true);
	}

	oHelper.data('drag-contatcs-storage', this.selectedStorage());
	oHelper.data('drag-contatcs-uids', aUids);
	
	$('.count-text', oHelper).text(TextUtils.i18n('%MODULENAME%/LABEL_DRAG_CONTACTS_PLURAL', {
		'COUNT': nCount
	}, null, nCount));

	return oHelper;
};

/**
 * @param {Object} oToGroup
 * @param {Object} oEvent
 * @param {Object} oUi
 */
CContactsView.prototype.contactsDrop = function (oToGroup, oEvent, oUi)
{
	if (oToGroup)
	{
		var
			oHelper = oUi && oUi.helper ? oUi.helper : null,
			aUids = oHelper ? oHelper.data('drag-contatcs-uids') : null
		;

		if (null !== aUids)
		{
			Utils.uiDropHelperAnim(oEvent, oUi);
			this.executeAddContactsToGroup(oToGroup, aUids);
		}
	}
};

CContactsView.prototype.contactsDropToGroupType = function (sDropStorage, oEvent, oUi)
{
	var
		oHelper = oUi && oUi.helper,
		sDragStorage = oHelper && oHelper.data('drag-contatcs-storage') || null,
		aUids = oHelper && oHelper.data('drag-contatcs-uids') || null
	;
	
	if (null !== aUids && null !== sDragStorage && sDropStorage !== sDragStorage)
	{
		Utils.uiDropHelperAnim(oEvent, oUi);
		this.executeShare();
	}
};

CContactsView.prototype.searchFocus = function ()
{
	if (this.selector.useKeyboardKeys() && !Utils.isTextFieldFocused())
	{
		this.isSearchFocused(true);
	}
};

/**
 * @param {mixed} mContact
 */
CContactsView.prototype.viewContact = function (mContact)
{
	if (mContact)
	{
		var
			sGroupUUID = (this.selectedStorage() === 'group') ? this.currentGroupUUID() : '',
			sContactUUID = (typeof mContact === 'string') ? mContact : mContact.UUID()
		;
		this.changeRouting({ GroupUUID: sGroupUUID, ContactUUID: sContactUUID });
	}
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.composeMessageToContact = function (oContact)
{
	var sEmail = oContact ? oContact.getFullEmail() : '';
	
	if (sEmail !== '')
	{
		this.composeMessageToAddresses(sEmail);
	}
};

CContactsView.prototype.composeMessage = function () {
	var
		aList = this.selector.listCheckedOrSelected(),
		aEmails = Types.isNonEmptyArray(aList) ? _.compact(_.map(aList, function (oItem) {
			return oItem.Email() !== '' ? oItem.getFullEmail() : '';
		})) : [],
		sEmails = aEmails.join(', ')
	;

	if (sEmails !== '')
	{
		this.composeMessageToAddresses(sEmails);
	}
};

CContactsView.prototype.onClearSearchClick = function ()
{
	// initiation empty search
	this.searchInput('');
	this.searchSubmitCommand();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetContactResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	if (oResult)
	{
		var
			oObject = new CContactModel(),
			oSelected  = this.selector.itemSelected()
		;

		oObject.parse(oResult);
		
		if (oSelected && oSelected.UUID() === oObject.uuid())
		{
			if (this.selectedContact() instanceof CContactModel && oObject instanceof CContactModel && this.selectedContact().uuid() === oObject.uuid())
			{
				oObject.edited(this.selectedContact().edited());
			}
			this.selectedItem(oObject);
		}
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetContactsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	
	if (oResult)
	{
		var
			iContactCount = Types.pInt(oResult.ContactCount),
			aNewCollection = Types.isNonEmptyArray(oResult.List) ? _.compact(_.map(oResult.List, function (oRawContactItem) {
				var oContactItem = new CContactListItemModel();
				oContactItem.parse(oRawContactItem);
				return oContactItem;
			})) : [],
			oSelected  = this.selector.itemSelected(),
			oNewSelected  = oSelected ? _.find(aNewCollection, function (oContactItem) {
				return oSelected.UUID() === oContactItem.UUID();
			}) : null,
			aChecked = this.selector.listChecked(),
			aCheckedIds = (aChecked && 0 < aChecked.length) ? _.map(aChecked, function (oItem) {
				return oItem.UUID();
			}) : []
		;

		if (Types.isNonEmptyArray(aCheckedIds))
		{
			_.each(aNewCollection, function (oContactItem) {
				oContactItem.checked(-1 < $.inArray(oContactItem.UUID(), aCheckedIds));
			});
		}

		this.collection(aNewCollection);
		this.oPageSwitcher.setCount(iContactCount);
		this.contactCount(iContactCount);

		if (oNewSelected)
		{
			this.selector.itemSelected(oNewSelected);
			this.requestContact(oNewSelected.UUID());
		}
		else if (oSelected)
		{
			this.changeRouting({}, true);
		}

		this.selectedGroupEmails(this.selectedGroup() ? _.uniq(_.flatten(_.map(this.collection(), function (oContactItem) {
			return oContactItem.aEmails;
		}))) : []);
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
	
	this.loadingList(false);
};

CContactsView.prototype.viewAllMails = function ()
{
	if (this.selectedGroupEmails().length > 0)
	{
		this.searchMessagesInInbox('email:' + this.selectedGroupEmails().join(','));
	}
};

CContactsView.prototype.viewEvent = function (calendarId, eventId, start)
{
	Routing.goDirectly(['calendar', calendarId, eventId, start]);
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	
	if (oResult)
	{
		var
			iIndex = 0,
			iLen = 0,
			aList = [],
			oSelected  = _.find(this.groupFullCollection(), function (oItem) {
				return oItem.selected();
			}) || null,
			oNewSelected = null
		;

		this.groupFullCollection(aList);
		for (iLen = oResult.length; iIndex < iLen; iIndex++)
		{
			if (oResult[iIndex])
			{
				oResult[iIndex].IsGroup = true;
				var oObject = new CContactListItemModel();
				oObject.parse(oResult[iIndex]);
				
				if (oObject.IsGroup())
				{
					if (oSelected && oSelected.UUID() === oObject.UUID())
					{
						oNewSelected = oObject;
					}

					aList.push(oObject);
				}
			}
		}
		
		this.selectedGroupInList(oNewSelected);
		if (oSelected !== null && oNewSelected === null)
		{
			Routing.replaceHash(LinksUtils.getContacts());
		}
		
		this.groupFullCollection(aList);
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onCreateGroupResponse = function (oResponse, oRequest)
{
	this.isSaving(false);
	if (oResponse.Result)
	{
		if (typeof oResponse.Result === 'string' && oResponse.Result !== '')
		{
			this.onViewGroupClick(oResponse.Result);
		}
		else
		{
			if (this.selectedGroup() && this.selectedGroup().edited())
			{
				this.selectedGroup().edited(false);
			}
		}
		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_GROUP_SUCCESSFULLY_ADDED'));
		this.requestGroupFullList();
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_SAVE_GROUP'));
	}
};

CContactsView.prototype.executeShare = function ()
{
	var
		bSelectedStorageAll = this.selectedStorage() === 'all',
		aChecked = _.filter(this.selector.listCheckedOrSelected(), function (oItem) {
			return oItem.sStorage !== 'team';
		}),
		aCheckedUUIDs = _.map(aChecked, function (oItem) {
			return oItem.UUID();
		})
	;
	
	aCheckedUUIDs = _.compact(aCheckedUUIDs);
	
	if (0 < aCheckedUUIDs.length)
	{
		_.each(aChecked, function (oContact) {
			if (oContact)
			{
				ContactsCache.clearInfoAboutEmail(oContact.Email());
			}
		}, this);
		
		if (!bSelectedStorageAll)
		{
			if (-1 < $.inArray(this.selectedContact(), aChecked))
			{
				this.selectedContact(null);
			}
				
			_.each(this.collection(), function (oContact) {
				if (-1 < $.inArray(oContact, aChecked))
				{
					oContact.deleted(true);
				}
			});

			_.delay(function () {
				this.collection.remove(function (oItem) {
					return oItem.deleted();
				});
			}.bind(this), 500);
		}

		if ('shared' === this.selectedStorage())
		{
			this.recivedAnimPersonal(true);
		}
		else
		{
			this.recivedAnimShared(true);
		}
	
		Ajax.send('UpdateSharedContacts', { 'UUIDs': aCheckedUUIDs }, function () {
			if (bSelectedStorageAll)
			{
				this.selector.listCheckedOrSelected(false);
				this.requestContactList();
			}
		}, this);
	}
};

/**
 * @param {Object} oItem
 */
CContactsView.prototype.requestGroup = function (oItem)
{
	this.loadingViewPane(true);
	
	if (oItem)
	{
		Ajax.send('GetGroup', {
			'UUID': oItem.UUID()
		}, this.onGetGroupResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		var oGroup = oResponse.Result;
		this.oGroupModel
			.uuid(Types.pString(oGroup.UUID))
			.name(oGroup.Name)
			.isOrganization(oGroup.IsOrganization)
			.company(oGroup.Company)
			.country(oGroup.Country)
			.state(oGroup.State)
			.city(oGroup.City)
			.street(oGroup.Street)
			.zip(oGroup.Zip)
			.phone(oGroup.Phone)
			.fax(oGroup.Fax)
			.email(oGroup.Email)
			.web(oGroup.Web)
		;
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupEventsResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		var Events = oResponse.Result;
		this.oGroupModel.events(Events);
	}
};

CContactsView.prototype.initUploader = function ()
{
	if (this.uploaderArea())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'dragAndDropElement': this.uploaderArea(),
			'disableAjaxUpload': false,
			'disableFolderDragAndDrop': false,
			'disableDragAndDrop': false,
			'hidden': _.extendOwn({
				'Module': Settings.ServerModuleName,
				'Method': 'Import',
				'Parameters':  _.bind(function () {
					return JSON.stringify({
						'GroupUUID': this.currentGroupUUID(),
						'Storage': 'personal'
					});
				}, this)
			}, App.getCommonRequestParameters())
		});
		
		this.oJua
			.on('onSelect', _.bind(this.onImportSelect, this))
			.on('onComplete', _.bind(this.onImportComplete, this))
			.on('onBodyDragEnter', _.bind(this.dragActive, this, true))
			.on('onBodyDragLeave', _.bind(this.dragActive, this, false))
		;
	}
};

CContactsView.prototype.onImportSelect = function (sFileUid, oFileData)
{
	var
		bAllowImport = this.isNotTeamStorageSelected(),
		bAllowFormat = false
	;
	
	if (bAllowImport)
	{
		_.each(Settings.ImportExportFormats, function (sFormat) {
			if (sFormat.toLowerCase() === oFileData.FileName.substr(oFileData.FileName.length - sFormat.length).toLowerCase())
			{
				bAllowFormat = true;
			}
		});
		
		if (!bAllowFormat)
		{
			Screens.showError(this.getFormatDependentText('ERROR_FILE_EXTENSION'));
			bAllowImport = false;
		}
	}
	
	return bAllowImport;
};

CContactsView.prototype.onImportComplete = function (sFileUid, bResponseReceived, oResponse)
{
	var
		bError = !bResponseReceived || !oResponse || !oResponse.Result || false,
		iImportedCount = 0
	;
	
	if (!bError)
	{
		iImportedCount = Types.pInt(oResponse.Result.ImportedCount);
		
		if (0 < iImportedCount)
		{
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_CONTACTS_IMPORTED_PLURAL', {
				'NUM': iImportedCount
			}, null, iImportedCount));
		}
		else
		{
			Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_IMPORT_NO_CONTACT'));
		}
	}
	else
	{
		if (oResponse && oResponse.ErrorCode === Enums.Errors.IncorrectFileExtension)
		{
			Screens.showError(this.getFormatDependentText('ERROR_FILE_EXTENSION'));
		}
		else
		{
			Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_UPLOAD_FILE'));
		}
	}
	
	this.requestGroupFullList();
	this.requestContactList();
};

module.exports = CContactsView;
