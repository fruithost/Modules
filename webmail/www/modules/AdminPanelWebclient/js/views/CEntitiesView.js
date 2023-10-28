'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	Cache = require('modules/%ModuleName%/js/Cache.js'),
	EntitiesTabs = require('modules/%ModuleName%/js/EntitiesTabs.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * Constructor of entities view. Creates, edits and deletes entities.
 * 
 * @param {string} sEntityType Type of entity processed here.
 * 
 * @constructor
 */
function CEntitiesView(sEntityType)
{
	this.bToolbarDisabled = App.getUserRole() === Enums.UserRole.TenantAdmin && sEntityType === 'Tenant';
	
	Cache.selectedTenantId.subscribe(function () {
		if (this.sType !== 'Tenant')
		{
			this.requestEntities();
		}
	}, this);
	this.sType = sEntityType;
	this.oEntityCreateView = EntitiesTabs.getEditView(this.sType);
	this.oEntityData = EntitiesTabs.getEntityData(this.sType);
	this.sActionCreateText = this.oEntityData.ActionCreateText;
	this.sNoEntitiesFoundText = this.oEntityData.NoEntitiesFoundText;
	
	this.entities = ko.observableArray([]);
	this.aFilters = [];
	this.initFilters();
	this.errorMessage = ko.observable('');
	
	this.totalEntitiesCount = ko.observable(0);
	this.entitiesCountText = ko.computed(function () {
		if (this.oEntityData.EntitiesCountText)
		{
			return this.oEntityData.EntitiesCountText.replace(/%COUNT%/g, this.totalEntitiesCount());
		}
		return '';
	}, this);
	this.current = ko.observable(0);
	this.showCreateForm = ko.observable(false);
	this.isCreating = ko.observable(false);
	this.hasSelectedEntity = ko.computed(function () {
		return !!_.find(this.entities(), function (oEntity) {
			return oEntity.Id === this.current();
		}.bind(this));
	}, this);
	
	this.idToDisplayAfterGetTenants = ko.observable(0);
	this.fChangeEntityHandler = function () {};
	
	ko.computed(function () {
		if (this.idToDisplayAfterGetTenants() === 0 && !this.showCreateForm() && !this.hasSelectedEntity() && this.entities().length > 0)
		{
			this.fChangeEntityHandler(this.sType, this.entities()[0].Id);
		}
	}, this).extend({ throttle: 1 });
	
	this.checkedEntities = ko.computed(function () {
		return _.filter(this.entities(), function (oEntity) {
			return oEntity.checked();
		}, this);
	}, this);
	this.hasCheckedEntities = ko.computed(function () {
		return this.checkedEntities().length > 0;
	}, this);
	this.deleteCommand = Utils.createCommand(this, this.deleteCheckedEntities, this.hasCheckedEntities);
	this.selectedCount = ko.computed(function () {
		return this.checkedEntities().length;
	}, this);
	
	this.searchValue = ko.observable('');
	this.newSearchValue = ko.observable('');
	this.isSearchFocused = ko.observable(false);
	this.loading = ko.observable(false);
	this.searchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.searchValue()
		});
	}, this);
	
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.EntitiesPerPage);
	this.oPageSwitcher.currentPage.subscribe(function () {
		this.requestEntities();
	}, this);
	this.totalEntitiesCount.subscribe(function () {
		this.oPageSwitcher.setCount(this.totalEntitiesCount());
	}, this);
	
	this.aIdListDeleteProcess = [];
	
	this.aAdditionalButtons = [];
	this.initAdditionalButtons();
}

CEntitiesView.prototype.ViewTemplate = '%ModuleName%_EntitiesView';
CEntitiesView.prototype.CreateFormViewTemplate = '%ModuleName%_EntityCreateFormView';

/**
 * Requests entity list after showing.
 */
CEntitiesView.prototype.onShow = function ()
{
	this.bShown = true;
	this.requestEntities();
};

CEntitiesView.prototype.onHide = function ()
{
	this.bShown = false;
};

/**
 * Checks if entity with specified identifier is on current page.
 * @param {Number} iEntityId
 * @returns {Boolean}
 */
CEntitiesView.prototype.hasEntity = function (iEntityId) {
	return !!_.find(this.entities(), function (oEntity) {
		return oEntity.Id === iEntityId;
	});
};

/**
 * Sets specified page and memorizes to set entity with specified ID as current after getting entities for specified page.
 * @param {Number} iPage
 * @param {Number} iEntityId
 */
CEntitiesView.prototype.setPageAndEntity = function (iPage, iEntityId) {
	if (this.oPageSwitcher.currentPage() !== iPage)
	{
		this.idToDisplayAfterGetTenants(iEntityId);
		this.oPageSwitcher.setPage(iPage, Settings.EntitiesPerPage);
	}
};

/**
 * Requests entity list for search string.
 */
CEntitiesView.prototype.search = function ()
{
	this.oPageSwitcher.setPage(1, Settings.EntitiesPerPage);
	this.requestEntities();
};

/**
 * Requests entity list without search string.
 */
CEntitiesView.prototype.clearSearch = function ()
{
	this.newSearchValue('');
	this.requestEntities();
};

CEntitiesView.prototype.initFilters = function ()
{
	_.each(this.oEntityData.Filters, function (oFilterData) {
		var oFilterObservables = {
			list: ko.computed(function () {
				var aFilterList = [];
				if (_.isFunction(oFilterData.mList))
				{
					aFilterList = oFilterData.mList();
					if (!_.isArray(aFilterList))
					{
						aFilterList = [];
					}
				}
				else if (_.isArray(oFilterData.mList))
				{
					aFilterList = oFilterData.mList;
				}
				if (aFilterList.length > 0)
				{
					if (oFilterData.sAllText)
					{
						aFilterList.unshift({
							text: oFilterData.sAllText,
							value: -1
						});
					}
					if (oFilterData.sNotInAnyText)
					{
						aFilterList.push({
							text: oFilterData.sNotInAnyText,
							value: 0
						});
					}
				}
				return aFilterList;
			}, this),
			selectedValue: ko.observable(-1),
			requestValue: ko.observable(-1),
			sAllText: oFilterData.sAllText,
			sFileld: oFilterData.sField,
			sEntity: oFilterData.sEntity
		};
		oFilterObservables.selectedValue.subscribe(function () {
			if (oFilterObservables.sEntity)
			{
				this.fChangeEntityHandler(oFilterObservables.sEntity, oFilterObservables.selectedValue());
			}
			else
			{
				oFilterObservables.requestValue(oFilterObservables.selectedValue());
			}
		}, this);
		oFilterObservables.requestValue.subscribe(function () {
			this.requestEntities();
		}, this);
		this.aFilters.push(oFilterObservables);
	}.bind(this));
};

CEntitiesView.prototype.initAdditionalButtons = function ()
{
	_.each(this.oEntityData.AdditionalButtons, function (oAdditionalButtonData) {
		if (oAdditionalButtonData && oAdditionalButtonData.ButtonView)
		{
			if (_.isFunction(oAdditionalButtonData.ButtonView.init))
			{
				oAdditionalButtonData.ButtonView.init(this.hasCheckedEntities, this.checkedEntities);
			}
			this.aAdditionalButtons.push(oAdditionalButtonData);
		}
	}.bind(this));
};

/**
 * Requests entity list.
 */
CEntitiesView.prototype.requestEntities = function ()
{
	if (this.bShown && (this.sType === 'Tenant' || Types.isPositiveNumber(Cache.selectedTenantId())))
	{
		var
			sEntityType = this.sType,
			oParameters = {
				TenantId: Cache.selectedTenantId(),
				Type: sEntityType,
				Offset: (this.oPageSwitcher.currentPage() - 1) * Settings.EntitiesPerPage,
				Limit: Settings.EntitiesPerPage,
				Search: this.newSearchValue()
			}
		;

		_.each(this.aFilters, function (oFilterObservables) {
			oParameters[oFilterObservables.sFileld] = oFilterObservables.requestValue();
		});

		this.searchValue(this.newSearchValue());
		this.loading(true);
		this.errorMessage('');
		Ajax.send(this.oEntityData.ServerModuleName, this.oEntityData.GetListRequest, oParameters, function (oResponse) {
			this.loading(false);
			if (oResponse.Result)
			{
				var
					aEntities = _.isArray(oResponse.Result.Items) ? oResponse.Result.Items : [],
					aParsedEntities = [],
					iCount = Types.pInt(oResponse.Result.Count)
				;

				_.each(aEntities, function (oEntity) {
					if (oEntity && oEntity.Id)
					{
						oEntity.Id = Types.pInt(oEntity.Id);
						oEntity.bItsMe = sEntityType === 'Tenant' && oEntity.Id === App.getTenantId() || sEntityType === 'User' && oEntity.Id === App.getUserId();
						oEntity.bIsDefault = !!oEntity.IsDefault;
						oEntity.checked = ko.observable(false);
						oEntity.trottleChecked = function (oItem, oEvent) {
							oEvent.stopPropagation();
							if (!this.bItsMe && !this.bIsDefault)
							{
								this.checked(!this.checked());
							}
						};
						aParsedEntities.push(oEntity);
					}
				});
				this.entities(aParsedEntities);
				this.totalEntitiesCount(iCount);
				if (this.entities().length === 0)
				{
					this.fChangeEntityHandler(sEntityType, undefined, 'create');
				}
				else if (this.idToDisplayAfterGetTenants() !== 0)
				{
					this.fChangeEntityHandler(sEntityType, this.idToDisplayAfterGetTenants());
				}
				this.aIdListDeleteProcess = [];
			}
			else
			{
				if (Types.isNonEmptyString(oResponse.ErrorMessage))
				{
					this.errorMessage(oResponse.ErrorMessage);
				}
				else
				{
					Api.showErrorByCode(oResponse);
				}
				this.entities([]);
			}
		}, this);
	}
};

/**
 * Sets change entity hanler provided by parent view object.
 * 
 * @param {Function} fChangeEntityHandler Change entity handler.
 */
CEntitiesView.prototype.setChangeEntityHandler = function (fChangeEntityHandler)
{
	this.fChangeEntityHandler = fChangeEntityHandler;
};

/**
 * Sets new current entity indentificator.
 * 
 * @param {number} iId New current entity indentificator.
 * @param {object} oEntities
 */
CEntitiesView.prototype.changeEntity = function (iId, oEntities)
{
	_.each(this.aFilters, function (oFilterObservables) {
		if (oEntities[oFilterObservables.sEntity])
		{
			oFilterObservables.selectedValue(oEntities[oFilterObservables.sEntity]);
			oFilterObservables.requestValue(oEntities[oFilterObservables.sEntity]);
		}
		else
		{
			if (oFilterObservables.selectedValue() <= 0)
			{
				oFilterObservables.requestValue(oFilterObservables.selectedValue());
			}
			else
			{
				oFilterObservables.selectedValue(-1);
				oFilterObservables.requestValue(-1);
			}
		}
	}.bind(this));
	this.current(Types.pInt(iId));
	this.idToDisplayAfterGetTenants(0);
};

/**
 * Opens create entity form.
 */
CEntitiesView.prototype.openCreateForm = function ()
{
	this.showCreateForm(true);
	this.oEntityCreateView.clearFields();
};

/**
 * Hides create entity form.
 */
CEntitiesView.prototype.cancelCreatingEntity = function ()
{
	this.showCreateForm(false);
};

/**
 * Send request to server to create new entity.
 */
CEntitiesView.prototype.createEntity = function ()
{
	if (this.oEntityCreateView && (this.sType === 'Tenant' || Types.isPositiveNumber(Cache.selectedTenantId())) && (!_.isFunction(this.oEntityCreateView.isValidSaveData) || this.oEntityCreateView.isValidSaveData()))
	{
		var oParameters = this.oEntityCreateView.getParametersForSave();
		oParameters['TenantId'] = Cache.selectedTenantId();
		
		this.isCreating(true);
		
		Ajax.send(this.oEntityData.ServerModuleName, this.oEntityData.CreateRequest, oParameters, function (oResponse) {
			if (oResponse.Result)
			{
				Screens.showReport(this.oEntityData.ReportSuccessCreateText);
				this.idToDisplayAfterGetTenants(Types.pInt(oResponse.Result));
				this.oEntityCreateView.updateSavedState();
				this.cancelCreatingEntity();
			}
			else
			{
				Api.showErrorByCode(oResponse, this.oEntityData.ErrorCreateText);
			}
			this.requestEntities();
			this.isCreating(false);
		}, this);
	}
};

/**
 * Deletes current entity.
 */
CEntitiesView.prototype.deleteCurrentEntity = function ()
{
	this.deleteEntities([this.current()]);
};

CEntitiesView.prototype.deleteCheckedEntities = function ()
{
	var aIdList = _.map(this.checkedEntities(), function (oEntity) {
		return oEntity.Id;
	});
	this.deleteEntities(aIdList);
};

CEntitiesView.prototype.deleteEntities = function (aIdList)
{
	if (!this.oEntityData.DeleteRequest)
	{
		return;
	}
	
	if (Types.isNonEmptyArray(this.aIdListDeleteProcess))
	{
		aIdList = _.difference(aIdList, this.aIdListDeleteProcess);
		this.aIdListDeleteProcess = _.union(aIdList, this.aIdListDeleteProcess);
	}
	else
	{
		this.aIdListDeleteProcess = aIdList;
	}
	if (aIdList.length > 0)
	{
		var
			sTitle = '',
			oEntityToDelete = aIdList.length === 1 ? _.find(this.entities(), function (oEntity) {
				return oEntity.Id === aIdList[0];
			}) : null,
			oDeleteEntityParams = {
				'Type': this.sType,
				'Count': aIdList.length,
				'ConfirmText': TextUtils.i18n(this.oEntityData.ConfirmDeleteLangConst, {}, null, aIdList.length)
			}
		;
		if (oEntityToDelete)
		{
			sTitle = oEntityToDelete.Name || oEntityToDelete.PublicId;
		}
		App.broadcastEvent('ConfirmDeleteEntity::before', oDeleteEntityParams);
		Popups.showPopup(ConfirmPopup, [
			oDeleteEntityParams.ConfirmText, 
			_.bind(this.confirmedDeleteEntities, this, aIdList), sTitle, TextUtils.i18n('COREWEBCLIENT/ACTION_DELETE')
		]);
	}
};

/**
 * Sends request to the server to delete entity if admin confirmed this action.
 * 
 * @param {array} aIdList
 * @param {boolean} bDelete Indicates if admin confirmed deletion.
 */
CEntitiesView.prototype.confirmedDeleteEntities = function (aIdList, bDelete)
{
	if (bDelete && Types.isPositiveNumber(Cache.selectedTenantId()))
	{
		var oParameters = {
			TenantId: Cache.selectedTenantId(),
			Type: this.sType,
			IdList: aIdList,
			DeletionConfirmedByAdmin: true
		};
		
		Ajax.send(this.oEntityData.ServerModuleName, this.oEntityData.DeleteRequest, oParameters, function (oResponse) {
			if (oResponse.Result)
			{
				Screens.showReport(TextUtils.i18n(this.oEntityData.ReportSuccessDeleteLangConst, {}, null, aIdList.length));
			}
			else
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n(this.oEntityData.ErrorDeleteLangConst, {}, null, aIdList.length));
			}
			this.requestEntities();
		}, this);
	}
	else
	{
		this.aIdListDeleteProcess = [];
	}
};

CEntitiesView.prototype.groupCheck = function ()
{
	var bCheckAll = !this.hasCheckedEntities();
	_.each(this.entities(), function (oEntity) {
		if (!oEntity.bItsMe && !oEntity.bIsDefault)
		{
			oEntity.checked(bCheckAll);
		}
	});
};

module.exports = CEntitiesView;
