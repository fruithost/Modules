'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	moment = require('moment'),
	
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	DateUtils = require('%PathToCoreWebclientModule%/js/utils/Date.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	
	CDateModel = require('%PathToCoreWebclientModule%/js/models/CDateModel.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CContactModel()
{
	this.sEmailDefaultType = Enums.ContactsPrimaryEmail.Personal;
	this.sPhoneDefaultType = Enums.ContactsPrimaryPhone.Mobile;
	this.sAddressDefaultType = Enums.ContactsPrimaryAddress.Personal;
	
	this.uuid = ko.observable('');
	this.idUser = ko.observable('');
	this.team = ko.observable(false);
	this.itsMe = ko.observable(false);
	this.storage = ko.observable('personal');

	this.isNew = ko.observable(false);
	this.readOnly = ko.observable(false);
	this.edited = ko.observable(false);
	this.extented = ko.observable(false);
	this.personalCollapsed = ko.observable(false);
	this.businessCollapsed = ko.observable(false);
	this.otherCollapsed = ko.observable(false);
	this.groupsCollapsed = ko.observable(false);

	this.displayName = ko.observable('');
	this.firstName = ko.observable('');
	this.lastName = ko.observable('');
	this.nickName = ko.observable('');

	this.skype = ko.observable('');
	this.facebook = ko.observable('');

	this.displayNameFocused = ko.observable(false);

	this.primaryEmail = ko.observable(this.sEmailDefaultType);
	this.primaryPhone = ko.observable(this.sPhoneDefaultType);
	this.primaryAddress = ko.observable(this.sAddressDefaultType);

	this.mainPrimaryEmail = ko.computed({
		'read': this.primaryEmail,
		'write': function (mValue) {
			if (mValue && 0 <= $.inArray(mValue, [Enums.ContactsPrimaryEmail.Personal, Enums.ContactsPrimaryEmail.Business, Enums.ContactsPrimaryEmail.Other]))
			{
				this.primaryEmail(mValue);
			}
			else
			{
				this.primaryEmail(Enums.ContactsPrimaryEmail.Personal);
			}
		},
		'owner': this
	});

	this.mainPrimaryPhone = ko.computed({
		'read': this.primaryPhone,
		'write': function (mValue) {
			if (mValue && 0 <= $.inArray(mValue, [Enums.ContactsPrimaryPhone.Mobile, Enums.ContactsPrimaryPhone.Personal, Enums.ContactsPrimaryPhone.Business]))
			{
				this.primaryPhone(mValue);
			}
			else
			{
				this.primaryPhone(Enums.ContactsPrimaryPhone.Mobile);
			}
		},
		'owner': this
	});
	
	this.mainPrimaryAddress = ko.computed({
		'read': this.primaryAddress,
		'write': function (mValue) {
			if (mValue && 0 <= $.inArray(mValue, [Enums.ContactsPrimaryAddress.Personal, Enums.ContactsPrimaryAddress.Business]))
			{
				this.primaryAddress(mValue);
			}
			else
			{
				this.primaryAddress(Enums.ContactsPrimaryAddress.Personal);
			}
		},
		'owner': this
	});

	this.personalEmail = ko.observable('');
	this.personalStreetAddress = ko.observable('');
	this.personalCity = ko.observable('');
	this.personalState = ko.observable('');
	this.personalZipCode = ko.observable('');
	this.personalCountry = ko.observable('');
	this.personalWeb = ko.observable('');
	this.personalFax = ko.observable('');
	this.personalPhone = ko.observable('');
	this.personalMobile = ko.observable('');

	this.businessEmail = ko.observable('');
	this.businessCompany = ko.observable('');
	this.businessDepartment = ko.observable('');
	this.businessJob = ko.observable('');
	this.businessOffice = ko.observable('');
	this.businessStreetAddress = ko.observable('');
	this.businessCity = ko.observable('');
	this.businessState = ko.observable('');
	this.businessZipCode = ko.observable('');
	this.businessCountry = ko.observable('');
	this.businessWeb = ko.observable('');
	this.businessFax = ko.observable('');
	this.businessPhone = ko.observable('');

	this.otherEmail = ko.observable('');
	this.otherBirthMonth = ko.observable(0);
	this.otherBirthDay = ko.observable(0);
	this.otherBirthYear = ko.observable(0);
	this.otherNotes = ko.observable('');
	this.etag = ko.observable('');
	
	this.sharedToAll = ko.observable(false);

	this.birthdayIsEmpty = ko.computed(function () {
		var
			bMonthEmpty = 0 === this.otherBirthMonth(),
			bDayEmpty = 0 === this.otherBirthDay(),
			bYearEmpty = 0 === this.otherBirthYear()
		;

		return (bMonthEmpty || bDayEmpty || bYearEmpty);
	}, this);
	
	this.otherBirthday = ko.computed(function () {
		var
			sBirthday = '',
			iYear = this.otherBirthYear(),
			iMonth = this.otherBirthMonth(),
			iDay = this.otherBirthDay(),
			oDateModel = new CDateModel()
		;
		
		if (!this.birthdayIsEmpty())
		{
			var fullYears = moment().diff(moment(iYear + '/' + iMonth + '/' + iDay, "YYYY/MM/DD"), 'years'),
				text = TextUtils.i18n('%MODULENAME%/LABEL_YEARS_PLURAL', {
					'COUNT': fullYears
				}, null, fullYears)
			;
			oDateModel.setDate(iYear, 0 < iMonth ? iMonth - 1 : 0, iDay);
			sBirthday = oDateModel.getShortDate() + ' (' + text + ')';
		}
		
		return sBirthday;
	}, this);

	this.groups = ko.observableArray([]);

	this.groupsIsEmpty = ko.computed(function () {
		return 0 === this.groups().length;
	}, this);

	this.email = ko.computed({
		'read': function () {
			var sResult = '';
			switch (this.primaryEmail()) {
				case Enums.ContactsPrimaryEmail.Personal:
					sResult = this.personalEmail();
					break;
				case Enums.ContactsPrimaryEmail.Business:
					sResult = this.businessEmail();
					break;
				case Enums.ContactsPrimaryEmail.Other:
					sResult = this.otherEmail();
					break;
			}
			return sResult;
		},
		'write': function (sEmail) {
			switch (this.primaryEmail()) {
				case Enums.ContactsPrimaryEmail.Personal:
					this.personalEmail(sEmail);
					break;
				case Enums.ContactsPrimaryEmail.Business:
					this.businessEmail(sEmail);
					break;
				case Enums.ContactsPrimaryEmail.Other:
					this.otherEmail(sEmail);
					break;
				default:
					this.primaryEmail(this.sEmailDefaultType);
					this.email(sEmail);
					break;
			}
		},
		'owner': this
	});

	this.personalIsEmpty = ko.computed(function () {
		var sPersonalEmail = (this.personalEmail() !== this.email()) ? this.personalEmail() : '';
		return '' === '' + sPersonalEmail +
			this.personalStreetAddress() +
			this.personalCity() +
			this.personalState() +
			this.personalZipCode() +
			this.personalCountry() +
			this.personalWeb() +
			this.personalFax() +
			this.personalPhone() +
			this.personalMobile()
		;
	}, this);

	this.businessIsEmpty = ko.computed(function () {
		var sBusinessEmail = (this.businessEmail() !== this.email()) ? this.businessEmail() : '';
		return '' === '' + sBusinessEmail +
			this.businessCompany() +
			this.businessDepartment() +
			this.businessJob() +
			this.businessOffice() +
			this.businessStreetAddress() +
			this.businessCity() +
			this.businessState() +
			this.businessZipCode() +
			this.businessCountry() +
			this.businessWeb() +
			this.businessFax() +
			this.businessPhone()
		;
	}, this);

	this.otherIsEmpty = ko.computed(function () {
		var sOtherEmail = (this.otherEmail() !== this.email()) ? this.otherEmail() : '';
		return ('' === ('' + sOtherEmail + this.otherNotes())) && this.birthdayIsEmpty();
	}, this);
	
	this.phone = ko.computed({
		'read': function () {
			var sResult = '';
			switch (this.primaryPhone()) {
				case Enums.ContactsPrimaryPhone.Mobile:
					sResult = this.personalMobile();
					break;
				case Enums.ContactsPrimaryPhone.Personal:
					sResult = this.personalPhone();
					break;
				case Enums.ContactsPrimaryPhone.Business:
					sResult = this.businessPhone();
					break;
			}
			return sResult;
		},
		'write': function (sPhone) {
			switch (this.primaryPhone()) {
				case Enums.ContactsPrimaryPhone.Mobile:
					this.personalMobile(sPhone);
					break;
				case Enums.ContactsPrimaryPhone.Personal:
					this.personalPhone(sPhone);
					break;
				case Enums.ContactsPrimaryPhone.Business:
					this.businessPhone(sPhone);
					break;
				default:
					this.primaryPhone(this.sEmailDefaultType);
					this.phone(sPhone);
					break;
			}
		},
		'owner': this
	});
	
	this.address = ko.computed({
		'read': function () {
			var sResult = '';
			switch (this.primaryAddress()) {
				case Enums.ContactsPrimaryAddress.Personal:
					sResult = this.personalStreetAddress();
					break;
				case Enums.ContactsPrimaryAddress.Business:
					sResult = this.businessStreetAddress();
					break;
			}
			return sResult;
		},
		'write': function (sAddress) {
			switch (this.primaryAddress()) {
				case Enums.ContactsPrimaryAddress.Personal:
					this.personalStreetAddress(sAddress);
					break;
				case Enums.ContactsPrimaryAddress.Business:
					this.businessStreetAddress(sAddress);
					break;
				default:
					this.primaryAddress(this.sEmailDefaultType);
					this.address(sAddress);
					break;
			}
		},
		'owner': this
	});

	this.emails = ko.computed(function () {
		var aList = [];
		
		if ('' !== this.personalEmail())
		{
			aList.push({'text': TextUtils.i18n('%MODULENAME%/LABEL_PERSONAL') + ': ' + this.personalEmail(), 'value': Enums.ContactsPrimaryEmail.Personal});
		}
		if ('' !== this.businessEmail())
		{
			aList.push({'text': TextUtils.i18n('%MODULENAME%/LABEL_BUSINESS') + ': ' + this.businessEmail(), 'value': Enums.ContactsPrimaryEmail.Business});
		}
		if ('' !== this.otherEmail())
		{
			aList.push({'text': TextUtils.i18n('%MODULENAME%/LABEL_OTHER') + ': ' + this.otherEmail(), 'value': Enums.ContactsPrimaryEmail.Other});
		}

		return aList;

	}, this);

	this.phones = ko.computed(function () {
		var aList = [];

		if ('' !== this.personalMobile())
		{
			aList.push({'text': TextUtils.i18n('%MODULENAME%/LABEL_MOBILE') + ': ' + this.personalMobile(), 'value': Enums.ContactsPrimaryPhone.Mobile});
		}
		if ('' !== this.personalPhone())
		{
			aList.push({'text': TextUtils.i18n('%MODULENAME%/LABEL_PERSONAL') + ': ' + this.personalPhone(), 'value': Enums.ContactsPrimaryPhone.Personal});
		}
		if ('' !== this.businessPhone())
		{
			aList.push({'text': TextUtils.i18n('%MODULENAME%/LABEL_BUSINESS') + ': ' + this.businessPhone(), 'value': Enums.ContactsPrimaryPhone.Business});
		}
		return aList;

	}, this);
	
	this.addresses = ko.computed(function () {
		var aList = [];

		if ('' !== this.personalStreetAddress())
		{
			aList.push({'text': TextUtils.i18n('%MODULENAME%/LABEL_PERSONAL') + ': ' + this.personalStreetAddress(), 'value': Enums.ContactsPrimaryAddress.Personal});
		}
		if ('' !== this.businessStreetAddress())
		{
			aList.push({'text': TextUtils.i18n('%MODULENAME%/LABEL_BUSINESS') + ': ' + this.businessStreetAddress(), 'value': Enums.ContactsPrimaryAddress.Business});
		}
		return aList;

	}, this);

	this.hasEmails = ko.computed(function () {
		return 0 < this.emails().length;
	}, this);
	
	this.allowSendThisContact = ko.computed(function () {
		return Settings.SaveVcfServerModuleName !== '';
	}, this);

	this.extented.subscribe(function (bValue) {
		if (bValue)
		{
			this.personalCollapsed(!this.personalIsEmpty());
			this.businessCollapsed(!this.businessIsEmpty());
			this.otherCollapsed(!this.otherIsEmpty());
			this.groupsCollapsed(!this.groupsIsEmpty());
		}
	}, this);

	this.birthMonthSelect = CContactModel.birthMonthSelect;
	
	this.birthDaySelect = ko.computed(function () {
		var
			iIndex = 1,
			iDaysInMonth = DateUtils.daysInMonth(this.otherBirthMonth(), this.otherBirthYear()),
			aList = [{'text': TextUtils.i18n('COREWEBCLIENT/LABEL_DAY'), 'value': 0}]
		;

		for (; iIndex <= iDaysInMonth; iIndex++)
		{
			aList.push({'text': iIndex.toString(), 'value': iIndex});
		}

		return aList;
	}, this);
	
	this.birthYearSelect = [
		{'text': TextUtils.i18n('%MODULENAME%/LABEL_YEAR'), 'value': 0}
	];
	for (var iCurrYear = (new Date()).getFullYear(), iIndex = iCurrYear, iFirstYear = iCurrYear - 100; iIndex >= iFirstYear; iIndex--)
	{
		this.birthYearSelect.push({ 'text': iIndex.toString(), 'value': iIndex });
	}
	
	this.canBeSave = ko.computed(function () {
		return this.displayName() !== '' || !!this.emails().length;
	}, this);
}

CContactModel.aBirthdayMonths = DateUtils.getMonthNamesArray();

CContactModel.birthMonthSelect = [
	{'text': TextUtils.i18n('COREWEBCLIENT/LABEL_MONTH'), value: 0},
	{'text': CContactModel.aBirthdayMonths[0], value: 1},
	{'text': CContactModel.aBirthdayMonths[1], value: 2},
	{'text': CContactModel.aBirthdayMonths[2], value: 3},
	{'text': CContactModel.aBirthdayMonths[3], value: 4},
	{'text': CContactModel.aBirthdayMonths[4], value: 5},
	{'text': CContactModel.aBirthdayMonths[5], value: 6},
	{'text': CContactModel.aBirthdayMonths[6], value: 7},
	{'text': CContactModel.aBirthdayMonths[7], value: 8},
	{'text': CContactModel.aBirthdayMonths[8], value: 9},
	{'text': CContactModel.aBirthdayMonths[9], value: 10},
	{'text': CContactModel.aBirthdayMonths[10], value: 11},
	{'text': CContactModel.aBirthdayMonths[11], value: 12}
];

CContactModel.prototype.clear = function ()
{
	this.isNew(false);
	this.readOnly(false);

	this.uuid('');
	this.idUser('');
	this.team(false);
	this.storage('');
	this.itsMe(false);

	this.edited(false);
	this.extented(false);
	this.personalCollapsed(false);
	this.businessCollapsed(false);
	this.otherCollapsed(false);
	this.groupsCollapsed(false);

	this.displayName('');
	this.firstName('');
	this.lastName('');
	this.nickName('');

	this.skype('');
	this.facebook('');

	this.primaryEmail(this.sEmailDefaultType);
	this.primaryPhone(this.sPhoneDefaultType);
	this.primaryAddress(this.sAddressDefaultType);

	this.personalEmail('');
	this.personalStreetAddress('');
	this.personalCity('');
	this.personalState('');
	this.personalZipCode('');
	this.personalCountry('');
	this.personalWeb('');
	this.personalFax('');
	this.personalPhone('');
	this.personalMobile('');

	this.businessEmail('');
	this.businessCompany('');
	this.businessDepartment('');
	this.businessJob('');
	this.businessOffice('');
	this.businessStreetAddress('');
	this.businessCity('');
	this.businessState('');
	this.businessZipCode('');
	this.businessCountry('');
	this.businessWeb('');
	this.businessFax('');
	this.businessPhone('');

	this.otherEmail('');
	this.otherBirthMonth(0);
	this.otherBirthDay(0);
	this.otherBirthYear(0);
	this.otherNotes('');

	this.etag('');
	this.sharedToAll(false);

	this.groups([]);
};

CContactModel.prototype.switchToNew = function ()
{
	this.clear();
	this.edited(true);
	this.extented(false);
	this.isNew(true);
	if (!App.isMobile())
	{
		this.displayNameFocused(true);
	}
};

CContactModel.prototype.switchToView = function ()
{
	this.edited(false);
	this.extented(false);
};

/**
 * @return {Object}
 */
CContactModel.prototype.toObject = function ()
{
	var oResult = {
		'UUID': this.uuid(),
		'PrimaryEmail': this.primaryEmail(),
		'PrimaryPhone': this.primaryPhone(),
		'PrimaryAddress': this.primaryAddress(),
		'FullName': this.displayName(),
		'FirstName': this.firstName(),
		'LastName': this.lastName(),
		'NickName': this.nickName(),

		'Storage': this.storage(),

		'Skype': this.skype(),
		'Facebook': this.facebook(),

		'PersonalEmail': this.personalEmail(),
		'PersonalAddress': this.personalStreetAddress(),
		'PersonalCity': this.personalCity(),
		'PersonalState': this.personalState(),
		'PersonalZip': this.personalZipCode(),
		'PersonalCountry': this.personalCountry(),
		'PersonalWeb': this.personalWeb(),
		'PersonalFax': this.personalFax(),
		'PersonalPhone': this.personalPhone(),
		'PersonalMobile': this.personalMobile(),

		'BusinessEmail': this.businessEmail(),
		'BusinessCompany': this.businessCompany(),
		'BusinessJobTitle': this.businessJob(),
		'BusinessDepartment': this.businessDepartment(),
		'BusinessOffice': this.businessOffice(),
		'BusinessAddress': this.businessStreetAddress(),
		'BusinessCity': this.businessCity(),
		'BusinessState': this.businessState(),
		'BusinessZip': this.businessZipCode(),
		'BusinessCountry': this.businessCountry(),
		'BusinessFax': this.businessFax(),
		'BusinessPhone': this.businessPhone(),
		'BusinessWeb': this.businessWeb(),

		'OtherEmail': this.otherEmail(),
		'Notes': this.otherNotes(),
		'ETag': this.etag(),
		'BirthDay': this.otherBirthDay(),
		'BirthMonth': this.otherBirthMonth(),
		'BirthYear': this.otherBirthYear(),

		'GroupUUIDs': this.groups()
	};

	return oResult;
};

/**
 * @param {Object} oData
 */
CContactModel.prototype.parse = function (oData)
{
	this.uuid(Types.pString(oData.UUID));
	this.idUser(Types.pString(oData.IdUser));

	this.team(oData.Storage === 'team');
	this.storage(Types.pString(oData.Storage));
	this.itsMe(!!oData.ItsMe);
	this.readOnly(!!oData.ReadOnly);

	this.displayName(Types.pString(oData.FullName));
	this.firstName(Types.pString(oData.FirstName));
	this.lastName(Types.pString(oData.LastName));
	this.nickName(Types.pString(oData.NickName));

	this.skype(Types.pString(oData.Skype));
	this.facebook(Types.pString(oData.Facebook));

	this.primaryEmail(Types.pInt(oData.PrimaryEmail));
	this.primaryPhone(Types.pInt(oData.PrimaryPhone));
	this.primaryAddress(Types.pInt(oData.PrimaryAddress));

	this.personalEmail(Types.pString(oData.PersonalEmail));
	this.personalStreetAddress(Types.pString(oData.PersonalAddress));
	this.personalCity(Types.pString(oData.PersonalCity));
	this.personalState(Types.pString(oData.PersonalState));
	this.personalZipCode(Types.pString(oData.PersonalZip));
	this.personalCountry(Types.pString(oData.PersonalCountry));
	this.personalWeb(Types.pString(oData.PersonalWeb));
	this.personalFax(Types.pString(oData.PersonalFax));
	this.personalPhone(Types.pString(oData.PersonalPhone));
	this.personalMobile(Types.pString(oData.PersonalMobile));

	this.businessEmail(Types.pString(oData.BusinessEmail));
	this.businessCompany(Types.pString(oData.BusinessCompany));
	this.businessDepartment(Types.pString(oData.BusinessDepartment));
	this.businessJob(Types.pString(oData.BusinessJobTitle));
	this.businessOffice(Types.pString(oData.BusinessOffice));
	this.businessStreetAddress(Types.pString(oData.BusinessAddress));
	this.businessCity(Types.pString(oData.BusinessCity));
	this.businessState(Types.pString(oData.BusinessState));
	this.businessZipCode(Types.pString(oData.BusinessZip));
	this.businessCountry(Types.pString(oData.BusinessCountry));
	this.businessWeb(Types.pString(oData.BusinessWeb));
	this.businessFax(Types.pString(oData.BusinessFax));
	this.businessPhone(Types.pString(oData.BusinessPhone));

	this.otherEmail(Types.pString(oData.OtherEmail));
	this.otherBirthMonth(Types.pInt(oData.BirthMonth));
	this.otherBirthDay(Types.pInt(oData.BirthDay));
	this.otherBirthYear(Types.pInt(oData.BirthYear));
	this.otherNotes(Types.pString(oData.Notes));

	this.etag(Types.pString(oData.ETag));

	this.sharedToAll(oData.Storage === 'shared');

	if (_.isArray(oData.GroupUUIDs))
	{
		this.groups(oData.GroupUUIDs);
	}
};

/**
 * @param {string} sEmail
 * @return {string}
 */
CContactModel.prototype.getFullEmail = function (sEmail)
{
	if (!Types.isNonEmptyString(sEmail))
	{
		sEmail = this.email();
	}
	return AddressUtils.getFullEmail(this.displayName(), sEmail);
};

CContactModel.prototype.getEmailsString = function ()
{
	return _.uniq(_.without([this.email(), this.personalEmail(), this.businessEmail(), this.otherEmail()], '')).join(',');
};

CContactModel.prototype.sendThisContact = function ()
{
	var
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
		fComposeMessageWithAttachments = ModulesManager.run('MailWebclient', 'getComposeMessageWithAttachments'),
		oParameters = {
			'UUID': this.uuid(),
			'FileName': 'contact-' + this.getFullEmail().replace('"', '').replace('<', '').replace('>', '') + '.vcf'
		}
	;

	Ajax.send('SaveContactAsTempFile', oParameters, function (oResponse) {
		if (oResponse.Result)
		{
			if (_.isFunction(fComposeMessageWithAttachments))
			{
				fComposeMessageWithAttachments([oResponse.Result]);
			}
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CONTACT_AS_TEMPFAILE'));
		}
	}, this);
};

/**
 * @param {?} mLink
 * @return {boolean}
 */
CContactModel.prototype.isStrLink = function (mLink)
{
	return (/^http/).test(mLink);
};

module.exports = CContactModel;
