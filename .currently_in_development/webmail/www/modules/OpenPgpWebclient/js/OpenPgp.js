'use strict';

let
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),

	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	openpgp = require('%PathToCoreWebclientModule%/js/vendors/openpgp.js'),
	Enums = require('modules/%ModuleName%/js/Enums.js'),
	COpenPgpKey = require('modules/%ModuleName%/js/COpenPgpKey.js'),
	COpenPgpResult = require('modules/%ModuleName%/js/COpenPgpResult.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	PGPKeyPasswordPopup = require('modules/%ModuleName%/js/popups/PGPKeyPasswordPopup.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	ErrorsUtils = require('modules/%ModuleName%/js/utils/Errors.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js')
;

/**
 * @constructor
 */
function COpenPgp()
{
	this.sPrefix = 'user_' + (App.getUserId() || '0') + '_';

	this.oKeyring = new openpgp.Keyring(new openpgp.Keyring.localstore(this.sPrefix));
	this.keys = ko.observableArray([]);
	this.oPromiseInitialised = this.initKeys();

	App.subscribeEvent('ContactsWebclient::createContactResponse', aParams => {
		let
			responseResult = aParams[0]
		;
		if (responseResult)
		{
			this.reloadKeysFromStorage();
		}
	});

	App.subscribeEvent('ContactsWebclient::updateContactResponse', aParams => {
		let
			responseResult = aParams[0]
		;
		if (responseResult)
		{
			this.reloadKeysFromStorage();
		}
	});

	App.subscribeEvent('ContactsWebclient::deleteContactsResponse', aParams => {
		let
			responseResult = aParams[0]
		;
		if (responseResult)
		{
			this.reloadKeysFromStorage();
		}
	});
}

COpenPgp.prototype.oKeyring = null;
COpenPgp.prototype.keys = [];

COpenPgp.prototype.initKeys = async function ()
{
	await this.oKeyring.load();
	await this.reloadKeysFromStorage();
};

/**
 * @return {Array}
 */
COpenPgp.prototype.getKeys = function ()
{
	return this.keys();
};

/**
 * @return {Array}
 */
COpenPgp.prototype.getPublicKeys = function ()
{
	return _.filter(this.keys(), oKey => {
		return oKey && oKey.isPublic() === true;
	});
};

/**
 * @return {Array}
 */
COpenPgp.prototype.getPrivateKeys = function ()
{
	return _.filter(this.keys(), oKey => {
		return oKey && oKey.isPublic() !== true;
	});
};

/**
 * @return {mixed}
 */
COpenPgp.prototype.getKeysObservable = function ()
{
	return this.keys;
};

/**
 * @private
 */
COpenPgp.prototype.reloadKeysFromStorage = async function ()
{
	let
		aKeys = [],
		aExternalKeys = [],
		oOpenpgpKeys = this.oKeyring.getAllKeys()
	;

	_.each(oOpenpgpKeys, oItem => {
		if (oItem && oItem.primaryKey)
		{
			aKeys.push(new COpenPgpKey(oItem));
		}
	});

	if (App.isUserNormalOrTenant())
	{
		aExternalKeys = await this.getPublicKeysFromContacts();
	}

	this.keys([...aKeys, ...aExternalKeys]);
};

/**
 * @return {Array}
 */
COpenPgp.prototype.getPublicKeysFromContacts = async function ()
{
	const oPromisePublicKeys = new Promise((resolve, reject) => {
		Ajax.send(
			'%ModuleName%',
			'GetPublicKeysFromContacts',
			{},
			async oResponse => {
				let aKeys = [];
				let	result = oResponse && oResponse.Result;
				if (!result.length)
				{
					resolve(aKeys);
					return false;
				}
				for (let key of result)
				{
					let oNativeKey = await openpgp.key.readArmored(key.PublicPgpKey);
					let oKey = null;
					if (
						oNativeKey
						&& !oNativeKey.err
						&& oNativeKey.keys
						&& oNativeKey.keys[0]
					)
					{
						oKey = new COpenPgpKey(oNativeKey.keys[0]);
						if (oKey)
						{
							oKey.isExternal = true;
							aKeys.push(oKey);
						}
					}
				}
				resolve(aKeys);
			},
			this
		);
	});

	return await oPromisePublicKeys;
};

/**
 * @private
 * @param {Array} aKeys
 * @return {Array}
 */
COpenPgp.prototype.convertToNativeKeys = function (aKeys)
{
	return _.map(aKeys, oItem => {
		return (oItem && oItem.pgpKey) ? oItem.pgpKey : oItem;
	});
};

/**
 * @private
 * @param {Object} oKey
 */
COpenPgp.prototype.cloneKey = async function (oKey)
{
	let oPrivateKey = null;
	if (oKey)
	{
		oPrivateKey = await openpgp.key.readArmored(oKey.armor());
		if (oPrivateKey && !oPrivateKey.err && oPrivateKey.keys && oPrivateKey.keys[0])
		{
			oPrivateKey = oPrivateKey.keys[0];
			if (!oPrivateKey || !oPrivateKey.primaryKey)
			{
				oPrivateKey = null;
			}
		}
		else
		{
			oPrivateKey = null;
		}
	}

	return oPrivateKey;
};

/**
 * @private
 * @param {Object} oResult
 * @param {Object} oKey
 * @param {string} sPassword
 * @param {string} sKeyEmail
 */
COpenPgp.prototype.decryptKeyHelper = async function (oResult, oKey, sPassword, sKeyEmail)
{
	if (oKey && oKey.primaryKey && oKey.primaryKey.isDecrypted() && sPassword === '')
	{
		//key is encoded with an empty password
	}
	else if(oKey)
	{
		try
		{
			await oKey.decrypt(Types.pString(sPassword));
			if (!oKey || !oKey.primaryKey || !oKey.primaryKey.isDecrypted())
			{
				oResult.addError(Enums.OpenPgpErrors.KeyIsNotDecodedError, sKeyEmail || '');
			}
		}
		catch (e)
		{
			oResult.addExceptionMessage(e, Enums.OpenPgpErrors.KeyIsNotDecodedError, sKeyEmail || '');
		}
	}
	else
	{
		oResult.addError(Enums.OpenPgpErrors.KeyIsNotDecodedError, sKeyEmail || '');
	}
};

/**
 * @private
 * @param {Object} oResult
 * @param {string} sFromEmail
 * @param {Object} oDecryptedMessage
 */
COpenPgp.prototype.verifyMessageHelper = async function (oResult, sFromEmail, oDecryptedMessage)
{
	let
		bResult = false,
		oValidKey = null,
		aVerifyResult = [],
		aVerifyKeysId = [],
		aPublicKeys = []
	;

	if (oDecryptedMessage && oDecryptedMessage.getSigningKeyIds)
	{
		aVerifyKeysId = oDecryptedMessage.getSigningKeyIds();
		if (aVerifyKeysId && 0 < aVerifyKeysId.length)
		{
			aPublicKeys = this.findKeysByEmails([sFromEmail], true);
			if (!aPublicKeys || 0 === aPublicKeys.length)
			{
				oResult.addNotice(Enums.OpenPgpErrors.PublicKeyNotFoundNotice, sFromEmail);
			}
			else
			{
				aVerifyResult = [];
				try
				{
					aVerifyResult = await oDecryptedMessage.verify(this.convertToNativeKeys(aPublicKeys));
				}
				catch (e)
				{
					oResult.addNotice(Enums.OpenPgpErrors.VerifyErrorNotice, sFromEmail);
				}

				if (aVerifyResult && 0 < aVerifyResult.length)
				{
					let aValidityPromises = [];
					for (let oKey of aVerifyResult)
					{
						aValidityPromises.push(
							oKey.verified
							.then(validity => {
								return oKey && oKey.keyid && validity ? oKey : null
							})
						);
					}
					await Promise.all(aValidityPromises)
					.then(aKeys => {
						oValidKey = _.find(aKeys, oKey => {
							return oKey !== null;
						});
						if (oValidKey && oValidKey.keyid &&
							aPublicKeys && aPublicKeys[0] &&
							aPublicKeys[0].hasId(oValidKey.keyid.toHex()))
						{
							bResult = true;
						}
						else
						{
							oResult.addNotice(Enums.OpenPgpErrors.VerifyErrorNotice, sFromEmail);
						}
					});
				}
			}
		}
		else
		{
			oResult.addNotice(Enums.OpenPgpErrors.NoSignDataNotice);
		}
	}
	else
	{
		oResult.addError(Enums.OpenPgpErrors.UnknownError);
	}

	if (!bResult && !oResult.hasNotices())
	{
		oResult.addNotice(Enums.OpenPgpErrors.VerifyErrorNotice);
	}

	return bResult;
};

/**
 * @param {string} sUserID
 * @param {string} sPassword
 * @param {number} nKeyLength
 * @param {Function} fOkHandler
 * @param {Function} fErrorHandler
 *
 * @return {COpenPgpResult}
 */
COpenPgp.prototype.generateKey = function (sUserID, sPassword, nKeyLength, fOkHandler, fErrorHandler)
{
	let
		oEmailParts = AddressUtils.getEmailParts(sUserID),
		oOptions = {
			userIds: [{ name: oEmailParts.name, email: oEmailParts.email }],
			numBits: nKeyLength,
			passphrase: sPassword
		}
	;

	openpgp.generateKey(oOptions).then(async oKeyPair => {
			await this.oKeyring.privateKeys.importKey(oKeyPair.privateKeyArmored);
			await this.oKeyring.publicKeys.importKey(oKeyPair.publicKeyArmored);
			await this.oKeyring.store();
			if (_.isFunction(fOkHandler))
			{
				fOkHandler();
			}
			this.reloadKeysFromStorage();
		},
		err => {
			if (_.isFunction(fErrorHandler))
			{
				fErrorHandler();
			}
		}
	);
};

/**
 * @private
 * @param {string} sArmor
 * @return {Array}
 */
COpenPgp.prototype.splitKeys = function (sArmor)
{
	let
		aResult = [],
		iCount = 0,
		iLimit = 30,
		aMatch = null,
		sKey = $.trim(sArmor),
		oReg = /[\-]{3,6}BEGIN[\s]PGP[\s](PRIVATE|PUBLIC)[\s]KEY[\s]BLOCK[\-]{3,6}[\s\S]+?[\-]{3,6}END[\s]PGP[\s](PRIVATE|PUBLIC)[\s]KEY[\s]BLOCK[\-]{3,6}/gi
	;

//	If the key doesn't have any additional fields (for example "Version: 1.1"), this transformation corrupts the key.
//	Seems like it is unnecessary transformation. Everything works fine without it.
//	sKey = sKey.replace(/[\r\n]([a-zA-Z0-9]{2,}:[^\r\n]+)[\r\n]+([a-zA-Z0-9\/\\+=]{10,})/g, '\n$1---xyx---$2')
//		.replace(/[\n\r]+/g, '\n').replace(/---xyx---/g, '\n\n');

	do
	{
		aMatch = oReg.exec(sKey);
		if (!aMatch || 0 > iLimit)
		{
			break;
		}

		if (aMatch[0] && aMatch[1] && aMatch[2] && aMatch[1] === aMatch[2])
		{
			if ('PRIVATE' === aMatch[1] || 'PUBLIC' === aMatch[1])
			{
				aResult.push([aMatch[1], aMatch[0]]);
				iCount++;
			}
		}

		iLimit--;
	}
	while (true);

	return aResult;
};

COpenPgp.prototype.isOwnEmail = function (sEmail)
{
	if (sEmail === App.getUserPublicId())
	{
		return true;
	}
	let
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
		aOwnEmails = ModulesManager.run('MailWebclient', 'getAllAccountsFullEmails') || []
	;
	return (_.find(aOwnEmails, sOwnEmail => {
		let oEmailParts = AddressUtils.getEmailParts(sOwnEmail);
		return sEmail === oEmailParts.email
	}) != undefined) ? true : false;
}

/**
 * @param {string} sArmor
 * @return {COpenPgpResult}
 */
COpenPgp.prototype.importKeys = async function (sArmor)
{
	sArmor = $.trim(sArmor);

	let
		iIndex = 0,
		iCount = 0,
		oResult = new COpenPgpResult(),
		aData = null,
		aKeys = [],
		iExternalCount = 0,
		aExternalKeys = []
	;

	if (!sArmor)
	{
		return oResult.addError(Enums.OpenPgpErrors.InvalidArgumentErrors);
	}

	aKeys = this.splitKeys(sArmor);

	for (iIndex = 0; iIndex < aKeys.length; iIndex++)
	{
		aData = aKeys[iIndex];
		if ('PRIVATE' === aData[0])
		{
			try
			{
				await this.oKeyring.privateKeys.importKey(aData[1]);
				iCount++;
			}
			catch (e)
			{
				oResult.addExceptionMessage(e, Enums.OpenPgpErrors.ImportKeyError, 'private');
			}
		}
		else if ('PUBLIC' === aData[0])
		{
			let oPublicKey = await openpgp.key.readArmored(aData[1]);
			if (oPublicKey && !oPublicKey.err && oPublicKey.keys && oPublicKey.keys[0])
			{
				let oKey = new COpenPgpKey(oPublicKey.keys[0]);

				if (this.isOwnEmail(oKey.getEmail()))
				{
					try
					{
						await this.oKeyring.publicKeys.importKey(aData[1]);
						iCount++;
					}
					catch (e)
					{
						oResult.addExceptionMessage(e, Enums.OpenPgpErrors.ImportKeyError, 'public');
					}
				}
				else
				{
					aExternalKeys.push(oKey);
					iExternalCount++;
				}
			}
		}
	}

	if (0 === iCount && 0 === iExternalCount)
	{
		oResult.addError(Enums.OpenPgpErrors.ImportNoKeysFoundError);
	}

	if (0 < iCount)
	{
		await this.oKeyring.store();
	}

	if (0 < iExternalCount)
	{
		const bImportResult = await this.importExternalKeys(aExternalKeys);
		if (bImportResult)
		{
			this.reloadKeysFromStorage();
		}
	}
	else
	{
		this.reloadKeysFromStorage();
	}

	return oResult;
};

/**
 * @param {Array} aExternalKeys
 * @return {boolean}
 */
COpenPgp.prototype.importExternalKeys = async function (aExternalKeys)
{
	let	aKeysParam = aExternalKeys.map(oKey => ({
		Email: oKey.getEmail(),
		Key: oKey.getArmor(),
		Name: oKey.getUserName()
	}));
	let oPromiseAddKeys = new Promise((resolve, reject) => {
		Ajax.send(
			'%ModuleName%',
			'AddPublicKeysToContacts',
			{ Keys: aKeysParam },
			oResponse => resolve(oResponse && oResponse.Result),
			this
		);
	});

	return await oPromiseAddKeys;
};

/**
 * @param {string} sArmor
 * @return {Array|boolean}
 */
COpenPgp.prototype.getArmorInfo = async function (sArmor)
{
	sArmor = $.trim(sArmor);

	let
		iIndex = 0,
		iCount = 0,
		oKey = null,
		aResult = [],
		aData = null,
		aKeys = []
	;

	if (!sArmor)
	{
		return false;
	}

	aKeys = this.splitKeys(sArmor);

	for (iIndex = 0; iIndex < aKeys.length; iIndex++)
	{
		aData = aKeys[iIndex];
		if ('PRIVATE' === aData[0])
		{
			try
			{
				oKey = await openpgp.key.readArmored(aData[1]);
				if (oKey && !oKey.err && oKey.keys && oKey.keys[0])
				{
					aResult.push(new COpenPgpKey(oKey.keys[0]));
				}

				iCount++;
			}
			catch (e)
			{
				aResult.push(null);
			}
		}
		else if ('PUBLIC' === aData[0])
		{
			try
			{
				oKey = await openpgp.key.readArmored(aData[1]);
				if (oKey && !oKey.err && oKey.keys && oKey.keys[0])
				{
					aResult.push(new COpenPgpKey(oKey.keys[0]));
				}

				iCount++;
			}
			catch (e)
			{
				aResult.push(null);
			}
		}
	}

	return aResult;
};

/**
 * @param {string} sID
 * @param {boolean} bPublic
 * @return {COpenPgpKey|null}
 */
COpenPgp.prototype.findKeyByID = function (sID, bPublic)
{
	bPublic = !!bPublic;
	sID = sID.toLowerCase();

	let oKey = _.find(this.keys(), oKey => {
		return bPublic === oKey.isPublic() && oKey.hasId(sID);
	});

	return oKey ? oKey : null;
};

/**
 * @param {Array} aEmail
 * @param {boolean} bIsPublic
 * @param {COpenPgpResult=} oResult
 * @return {Array}
 */
COpenPgp.prototype.findKeysByEmails = function (aEmail, bIsPublic, oResult)
{
	bIsPublic = !!bIsPublic;

	let
		aResult = [],
		aKeys = this.keys()
	;
	_.each(aEmail, sEmail => {
		let oKey = _.find(aKeys, oKey => {
			return oKey && bIsPublic === oKey.isPublic() && sEmail === oKey.getEmail();
		});

		if (oKey)
		{
			aResult.push(oKey);
		}
		else
		{
			if (oResult)
			{
				oResult.addError(bIsPublic ?
					Enums.OpenPgpErrors.PublicKeyNotFoundError : Enums.OpenPgpErrors.PrivateKeyNotFoundError, sEmail);
			}
		}
	});

	return aResult;
};

/**
 * @param {type} aEmail
 * @returns {Array}
 */
COpenPgp.prototype.getPublicKeysIfExistsByEmail = function (sEmail)
{
	let
		aResult = [],
		aKeys = this.keys(),
		oKey = _.find(aKeys, oKey => {
			return oKey && oKey.isPublic() === true && sEmail === oKey.getEmail();
		})
	;

	if (oKey)
	{
		aResult.push(oKey);
	}

	return aResult;
};

/**
 * @param {object} oKey
 * @param {string} sPrivateKeyPassword
 * @returns {object}
 */
COpenPgp.prototype.verifyKeyPassword = async function (oKey, sPrivateKeyPassword)
{
	let
		oResult = new COpenPgpResult(),
		oPrivateKey = this.convertToNativeKeys([oKey])[0],
		oPrivateKeyClone = await this.cloneKey(oPrivateKey)
	;

	await this.decryptKeyHelper(oResult, oPrivateKeyClone, sPrivateKeyPassword, '');
	if (
		!oResult.hasErrors()
		&& !oKey.getPassphrase()
		&& Settings.rememberPassphrase()
	)
	{
		oKey.setPassphrase(sPrivateKeyPassword);
	}

	return oResult;
};

/**
 * @param {string} sData
 * @param {object} oEncryptionKey
 * @param {string} sFromEmail
 * @param {string} sPrivateKeyPassword = ''
 * @param {Function} fOkHandler
 * @param {Function} fErrorHandler
 * @return {string}
 */
COpenPgp.prototype.decryptAndVerify = async function (sData, oEncryptionKey, sFromEmail, sPrivateKeyPassword, fOkHandler, fErrorHandler)
{
	let
		oResult = new COpenPgpResult(),
		aPublicKeys = this.getPublicKeysIfExistsByEmail(sFromEmail)
	;

	try
	{
		const oDecryptionResult = await this.decryptData(
			sData,
			sPrivateKeyPassword,
			false, //bPasswordBasedEncryption
			[oEncryptionKey],
			aPublicKeys
		);

		if (oDecryptionResult.result && _.isFunction(fOkHandler))
		{
			fOkHandler(oDecryptionResult);
		}
		else if (_.isFunction(fErrorHandler))
		{
			fErrorHandler(oDecryptionResult);
		}
	}
	catch (e)
	{
		oResult.addExceptionMessage(e, Enums.OpenPgpErrors.VerifyAndDecryptError);
		if (_.isFunction(fErrorHandler))
		{
			fErrorHandler(oResult);
		}
	}
};

/**
 * @param {string} sData
 * @param {string} sFromEmail
 * @param {Function} fOkHandler
 * @param {Function} fErrorHandler
 * @return {string}
 */
COpenPgp.prototype.verify = async function (sData, sFromEmail, fOkHandler, fErrorHandler)
{
	let
		oMessage = await openpgp.cleartext.readArmored(sData),
		oResult = new COpenPgpResult(),
		aPublicKeys = this.findKeysByEmails([sFromEmail], true, oResult),
		oOptions = {
			message: oMessage,
			publicKeys: this.convertToNativeKeys(aPublicKeys) // for verification
		}
	;

	openpgp.verify(oOptions).then(_.bind(async function(oPgpResult) {
		let aValidityPromises = [];
		let aValidSignatures = [];
		for (let oSignature of oPgpResult.signatures)
		{
			aValidityPromises.push(
				oSignature.verified
				.then(validity => {
					return oSignature && validity === true ? oSignature : null
				})
			);
		}
		await Promise.all(aValidityPromises)
		.then(aSignatures => {
			aValidSignatures = _.filter(aSignatures, function (oSignature) {
				return oSignature !== null;
			});
		});
		if (aValidSignatures.length)
		{
			await this.verifyMessageHelper(oResult, sFromEmail, oMessage);
			oResult.result = oMessage.getText();
			if (oResult.notices && _.isFunction(fErrorHandler))
			{
				fErrorHandler(oResult);
			}
			else if (_.isFunction(fOkHandler))
			{
				fOkHandler(oResult);
			}
		}
		else
		{
			oResult.addError(Enums.OpenPgpErrors.CanNotReadMessage);
			if (_.isFunction(fErrorHandler))
			{
				fErrorHandler(oResult);
			}
		}
	}, this), function (e) {
		oResult.addExceptionMessage(e, Enums.OpenPgpErrors.CanNotReadMessage);
		if (_.isFunction(fErrorHandler))
		{
			fErrorHandler(oResult);
		}
	});
};

/**
 * @param {string} sData
 * @param {Array} aPrincipalsEmail
 * @param {Function} fOkHandler
 * @param {Function} fErrorHandler
 * @return {string}
 */
COpenPgp.prototype.encrypt = async function (sData, aPrincipalsEmail, fOkHandler, fErrorHandler)
{
	let
		oResult = new COpenPgpResult(),
		aPublicKeys = this.findKeysByEmails(aPrincipalsEmail, true, oResult)
	;

	if (!oResult.hasErrors())
	{
		try
		{
			const oEncryptionResult = await this.encryptData(sData, aPublicKeys);
			if (oEncryptionResult.result)
			{
				let { data, password } = oEncryptionResult.result;
				oEncryptionResult.result = data;
				if (_.isFunction(fOkHandler))
				{
					fOkHandler(oEncryptionResult);
				}
			}
			else if (_.isFunction(fErrorHandler))
			{
				fErrorHandler(oEncryptionResult);
			}
		}
		catch (e)
		{
			oResult.addExceptionMessage(e, Enums.OpenPgpErrors.EncryptError);
			if (_.isFunction(fErrorHandler))
			{
				fErrorHandler(oResult);
			}
		}
	}
	else if (_.isFunction(fErrorHandler))
	{
		fErrorHandler(oResult);
	}
};

/**
 * @param {string} sData
 * @param {string} sFromEmail
 * @param {string} sPassphrase
 * @param {Function} fOkHandler
 * @param {Function} fErrorHandler
 * @return {string}
 */
COpenPgp.prototype.sign = async function (sData, sFromEmail, fOkHandler, fErrorHandler, sPassphrase = '')
{
	let
		oResult = new COpenPgpResult(),
		oPrivateKey = null,
		oPrivateKeyClone = null,
		aPrivateKeys = this.findKeysByEmails([sFromEmail], false, oResult)
	;

	if (!oResult.hasErrors())
	{
		oPrivateKey = this.convertToNativeKeys(aPrivateKeys)[0];
		oPrivateKeyClone = await this.cloneKey(oPrivateKey);

		if (sPassphrase === '')
		{
			sPassphrase = await this.askForKeyPassword(aPrivateKeys[0].getUser());
			if (sPassphrase === false)
			{
				// returning userCanceled status so that error message won't be shown
				oResult.userCanceled = true;
				return oResult;
			}
			else
			{
				// returning passphrase so that it won't be asked again until current action popup is closed
				oResult.passphrase = sPassphrase;
			}
		}

		await this.decryptKeyHelper(oResult, oPrivateKeyClone, sPassphrase, sFromEmail);

		if (oPrivateKeyClone && !oResult.hasErrors())
		{
			let oOptions = {
				message: openpgp.cleartext.fromText(sData),
				privateKeys: oPrivateKeyClone
			};

			openpgp.sign(oOptions).then(function(oPgpResult) {
				oResult.result = oPgpResult.data;
				if (_.isFunction(fOkHandler))
				{
					fOkHandler(oResult);
				}
			}, function (e) {
				oResult.addExceptionMessage(e, Enums.OpenPgpErrors.SignError, sFromEmail);
				if (_.isFunction(fErrorHandler))
				{
					fErrorHandler(oResult);
				}
			});
		}
		else if (_.isFunction(fErrorHandler))
		{
			fErrorHandler(oResult);
		}
	}
	else if (_.isFunction(fErrorHandler))
	{
		fErrorHandler(oResult);
	}
};

/**
 * @param {string} sData
 * @param {string} sFromEmail
 * @param {Array} aPrincipalsEmail
 * @param {string} sPassphrase
 * @param {Function} fOkHandler
 * @param {Function} fErrorHandler
 * @return {string}
 */
COpenPgp.prototype.signAndEncrypt = async function (sData, sFromEmail, aPrincipalsEmail, sPassphrase, fOkHandler, fErrorHandler)
{
	let
		oPrivateKey = null,
		oPrivateKeyClone = null,
		oResult = new COpenPgpResult(),
		aPrivateKeys = this.findKeysByEmails([sFromEmail], false, oResult),
		aPublicKeys = this.findKeysByEmails(aPrincipalsEmail, true, oResult)
	;

	if (!oResult.hasErrors())
	{
		try
		{
			const oEncryptionResult = await this.encryptData(sData,
				aPublicKeys,
				aPrivateKeys,
				false, //bPasswordBasedEncryption
				true, //bSign
				sPassphrase
			);
			if (oEncryptionResult.result)
			{
				let { data, password } = oEncryptionResult.result;
				if (_.isFunction(fOkHandler))
				{
					fOkHandler({result: data});
				}
			}
			else if (_.isFunction(fErrorHandler))
			{
				fErrorHandler(oEncryptionResult);
			}
		}
		catch (e)
		{
			oResult.addExceptionMessage(e, Enums.OpenPgpErrors.SignAndEncryptError);
			if (_.isFunction(fErrorHandler))
			{
				fErrorHandler(oResult);
			}
		}
	}
	else if (_.isFunction(fErrorHandler))
	{
		fErrorHandler(oResult);
	}
};

/**
 * @param {blob|string} Data
 * @param {array} aPublicKeys
 * @param {array} aPrivateKeys
 * @param {string} sPrincipalsEmail
 * @param {boolean} bPasswordBasedEncryption
 * @param {boolean} bSign
 * @param {string} sPassphrase
 * @return {COpenPgpResult}
 */
COpenPgp.prototype.encryptData = async function (Data, aPublicKeys = [], aPrivateKeys = [], bPasswordBasedEncryption = false, bSign = false, sPassphrase = '')
{
	let
		oResult = new COpenPgpResult(),
		sPassword = '',
		bIsBlob = Data instanceof Blob,
		buffer = null,
		oOptions = {}
	;

	oResult.result = false;
	if (bIsBlob)
	{
		buffer = await new Response(Data).arrayBuffer();
		oOptions.message = openpgp.message.fromBinary(new Uint8Array(buffer));
		oOptions.armor = false;
		Data = null;
		buffer = null;
	}
	else
	{
		oOptions.message = openpgp.message.fromText(Data);
	}

	if (bPasswordBasedEncryption)
	{
		sPassword = this.generatePassword();
		oOptions.passwords = [sPassword];
	}
	else if (Types.isNonEmptyArray(aPublicKeys))
	{
		oOptions.publicKeys = this.convertToNativeKeys(aPublicKeys);
	}

	if (bSign && aPrivateKeys && aPrivateKeys.length > 0)
	{
		let
			oPrivateKey = this.convertToNativeKeys(aPrivateKeys)[0],
			oPrivateKeyClone = await this.cloneKey(oPrivateKey),
			sStoredPassphrase = aPrivateKeys[0].getPassphrase()
		;

		if (sStoredPassphrase && !sPassphrase)
		{
			sPassphrase = sStoredPassphrase;
		}

		if (!sPassphrase)
		{
			sPassphrase = await this.askForKeyPassword(aPrivateKeys[0].getUser());
			if (sPassphrase === false)
			{
				// returning userCanceled status so that error message won't be shown
				oResult.userCanceled = true;
				return oResult;
			}
			else
			{
				// returning passphrase so that it won't be asked again until current action popup is closed
				oResult.passphrase = sPassphrase;
			}
		}
		await this.decryptKeyHelper(oResult, oPrivateKeyClone, sPassphrase, aPrivateKeys[0].getEmail());
		if (
			!oResult.hasErrors()
			&& !sStoredPassphrase
			&& Settings.rememberPassphrase()
		)
		{
			aPrivateKeys[0].setPassphrase(sPassphrase);
		}
		oOptions.privateKeys = [oPrivateKeyClone];
	}
	if (!oResult.hasErrors())
	{
		try
		{
			let oPgpResult = await openpgp.encrypt(oOptions);

			oResult.result = {
				data:		bIsBlob ? oPgpResult.message.packets.write() : oPgpResult.data,
				password:	sPassword
			};
		}
		catch (e)
		{
			oResult.addExceptionMessage(e, Enums.OpenPgpErrors.EncryptError);
		}
	}

	return oResult;
};

/**
 * @param {blob|string} Data
 * @param {string} sPassword
 * @param {boolean} bPasswordBasedEncryption
 * @param {array} aPublicKeys
 * @return {string}
 */
COpenPgp.prototype.decryptData = async function (Data, sPassword = '', bPasswordBasedEncryption = false, aPrivateKeys = [], aPublicKeys = [])
{
	let
		oResult = new COpenPgpResult(),
		bIsBlob = Data instanceof Blob,
		buffer = null,
		sEmail = ''
	;

	//if public keys are not defined - use all public keys for verification
	aPublicKeys = Types.isNonEmptyArray(aPublicKeys) ? aPublicKeys : this.getPublicKeys();
	let oOptions = {
		publicKeys: this.convertToNativeKeys(aPublicKeys) // for verification
	};

	if (bIsBlob)
	{
		buffer = await new Response(Data).arrayBuffer();
		oOptions.message = await openpgp.message.read(new Uint8Array(buffer));
		oOptions.format = 'binary';
	}
	else
	{
		oOptions.message = await openpgp.message.readArmored(Data);
	}

	if (!Types.isNonEmptyArray(aPrivateKeys))
	{
		let aKeyIds = oOptions.message.getEncryptionKeyIds().map(oKeyId => oKeyId.toHex());
		aPrivateKeys = aKeyIds
			.map(sKeyId => this.findKeyByID(sKeyId, /*bPublic*/false))
			.filter(oKey => oKey !== null);
	}
	oResult.result = false;

	if (bPasswordBasedEncryption)
	{
		oOptions.passwords = [sPassword];
	}
	else
	{
		if (aPrivateKeys && aPrivateKeys.length > 0)
		{
			let
				oPrivateKey = this.convertToNativeKeys(aPrivateKeys)[0],
				oPrivateKeyClone = await this.cloneKey(oPrivateKey),
				sStoredPassphrase = aPrivateKeys[0].getPassphrase(),
				sPassphrase = sPassword
			;

			if (sStoredPassphrase && !sPassphrase)
			{
				sPassphrase = sStoredPassphrase;
			}

			if (!sPassphrase)
			{
				sPassphrase = await this.askForKeyPassword(aPrivateKeys[0].getUser());
				if (sPassphrase === false)
				{
					// returning userCanceled status so that error message won't be shown
					oResult.userCanceled = true;
					return oResult;
				}
				else
				{
					// returning passphrase so that it won't be asked again until current action popup is closed
					oResult.passphrase = sPassphrase;
				}
			}
			sEmail = aPrivateKeys[0].getEmail();
			await this.decryptKeyHelper(oResult, oPrivateKeyClone, sPassphrase, sEmail);
			if (
				!oResult.hasErrors()
				&& !sStoredPassphrase
				&& Settings.rememberPassphrase()
			)
			{
				aPrivateKeys[0].setPassphrase(sPassphrase);
			}
			oOptions.privateKeys = oPrivateKeyClone;
		}
		else
		{
			oResult.addError(Enums.OpenPgpErrors.PrivateKeyNotFoundError);
			return oResult;
		}
	}

	if (!oResult.hasErrors())
	{
		try
		{
			let oPgpResult = await openpgp.decrypt(oOptions);
			oResult.result = await openpgp.stream.readToEnd(oPgpResult.data);
			//if result contains invalid signatures
			let aValidityPromises = [];
			for (let oSignature of oPgpResult.signatures)
			{
				aValidityPromises.push(
					oSignature.verified
					.then(validity => {
						oSignature.is_valid = validity;
						return oSignature;
					})
				);
			}
			await Promise.all(aValidityPromises)
			.then(aSignatures => {
				const aInvalidSignatures = _.filter(aSignatures, oSignature => {
					return oSignature !== null && oSignature.is_valid !== true;
				});
				const aValidSignatures = _.filter(aSignatures, oSignature => {
					return oSignature !== null && oSignature.is_valid === true;
				});

				if (oPgpResult.signatures.length && aInvalidSignatures.length > 0)
				{
					oResult.addNotice(Enums.OpenPgpErrors.VerifyErrorNotice, sEmail);
				}
				else if (aValidSignatures.length > 0)
				{
					const aKeyNames = _.map(aValidSignatures, oSignature => {
						const sKeyID = oSignature.keyid.toHex();
						const oKey = this.findKeyByID(sKeyID, true);
						return oKey.getUser();
					});
					oResult.validKeyNames = aKeyNames;
				}
			});
		}
		catch (e)
		{
			oResult.addExceptionMessage(e, Enums.OpenPgpErrors.VerifyAndDecryptError);
		}
	}

	return oResult;
};

COpenPgp.prototype.getPrivateKeyPassword = async function (sEmail)
{
	let
		oResult = new COpenPgpResult(),
		aPrivateKeys = this.findKeysByEmails([sEmail], false, oResult)
	;

	if (Types.isNonEmptyArray(aPrivateKeys))
	{
		let
			oPrivateKey = this.convertToNativeKeys(aPrivateKeys)[0],
			oPrivateKeyClone = await this.cloneKey(oPrivateKey),
			sStoredPassphrase = aPrivateKeys[0].getPassphrase(),
			sPassphrase = null
		;

		if (sStoredPassphrase)
		{
			sPassphrase = sStoredPassphrase;
		}

		if (!sPassphrase)
		{
			sPassphrase = await this.askForKeyPassword(aPrivateKeys[0].getUser());
			if (sPassphrase === false)
			{//user cancel operation
				return null;
			}
		}

		await this.decryptKeyHelper(oResult, oPrivateKeyClone, sPassphrase, sEmail);

		if (
			!oResult.hasErrors()
			&& !sStoredPassphrase
			&& Settings.rememberPassphrase()
		)
		{
			aPrivateKeys[0].setPassphrase(sPassphrase);
		}

		if (!oResult.hasErrors())
		{
			return sPassphrase;
		}
	}

	return null;
};

COpenPgp.prototype.askForKeyPassword = async function (sKeyName)
{
	let oPromiseKeyPassword = new Promise( (resolve, reject) => {
		const fOnPasswordEnterCallback = sKeyPassword => {
			resolve(sKeyPassword);
		};
		const fOnCancellCallback = () => {
			resolve(false);
		};
		//showing popup
		Popups.showPopup(PGPKeyPasswordPopup, [
				sKeyName,
				fOnPasswordEnterCallback,
				fOnCancellCallback
		]);
	});

	let sPassword = await oPromiseKeyPassword;

	return sPassword;
};

/**
 * @param {COpenPgpKey} oKey
 */
COpenPgp.prototype.deleteKey = async function (oKey)
{
	let oResult = new COpenPgpResult();
	if (oKey)
	{
		if (!oKey.isExternal)
		{
			try
			{
				this.oKeyring[oKey.isPrivate() ? 'privateKeys' : 'publicKeys'].removeForId(oKey.getFingerprint());
				await this.oKeyring.store();

				this.reloadKeysFromStorage();
			}
			catch (e)
			{
				oResult.addExceptionMessage(e, Enums.OpenPgpErrors.DeleteError);
			}
		}
		else
		{
			let
				ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js')
			;
			ModulesManager.run('%ModuleName%', 'deleteExternalKey', [oKey, res => {
				this.reloadKeysFromStorage();
			}])
		}
	}
	else
	{
		oResult.addError(oKey ? Enums.OpenPgpErrors.UnknownError : Enums.OpenPgpErrors.InvalidArgumentError);
	}

	return oResult;
};

COpenPgp.prototype.getEncryptionKeyFromArmoredMessage = async function (sArmoredMessage)
{
	let oMessage = await openpgp.message.readArmored(sArmoredMessage);
	let aEncryptionKeys = oMessage.getEncryptionKeyIds();
	let oEncryptionKey = null;

	if (aEncryptionKeys.length > 0)
	{
		for (let key of aEncryptionKeys)
		{
			let oKey = this.findKeyByID(key.toHex(), false);
			if (oKey)
			{
				oEncryptionKey = oKey;
				break;
			}
		}
	}

	return oEncryptionKey;
};

COpenPgp.prototype.generatePassword = function ()
{
	let sPassword = "";

	if (window.crypto)
	{
		let password = window.crypto.getRandomValues(new Uint8Array(10));
		sPassword = btoa(String.fromCharCode.apply(null, password));
		sPassword = sPassword.replace(/[^A-Za-z0-9]/g, "");
	}
	else
	{
		const sSymbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!;%:?*()_+=";

		for (let i = 0; i < this.iPasswordLength; i++)
		{
			sPassword += sSymbols.charAt(Math.floor(Math.random() * sSymbols.length));
		}
	}

	return sPassword;
};

COpenPgp.prototype.getCurrentUserPrivateKey = async function ()
{
	let mResult = null;
	let sUserEmail = App.getUserPublicId ? App.getUserPublicId() : '';
	let aPrivateKeys = this.findKeysByEmails([sUserEmail], /*bIsPublic*/false);

	if (aPrivateKeys.length < 1)
	{
		const sError = TextUtils.i18n('%MODULENAME%/ERROR_NO_PRIVATE_KEYS_FOR_USERS_PLURAL',
			{'USERS': sUserEmail}, null, 1);
		Screens.showError(sError);
	}
	else
	{
		mResult = aPrivateKeys[0];
	}

	return mResult;
};

COpenPgp.prototype.getCurrentUserPublicKey = async function ()
{
	let mResult = null;
	let sUserEmail = App.getUserPublicId ? App.getUserPublicId() : '';
	let aPrivateKeys = this.findKeysByEmails([sUserEmail], /*bIsPublic*/false);

	if (aPrivateKeys.length > 0)
	{
		let aNativePrivateKeys = this.convertToNativeKeys(aPrivateKeys);
		mResult = aNativePrivateKeys[0].toPublic();
	}
	else
	{
		let aPublicKeys = this.findKeysByEmails([sUserEmail], /*bIsPublic*/true);
		if (aPublicKeys.length > 0)
		{
			mResult = aPublicKeys[0];
		}
	}
	if (!mResult)
	{
		const sError = TextUtils.i18n('%MODULENAME%/ERROR_NO_PUBLIC_KEYS_FOR_USERS_PLURAL',
			{'USERS': sUserEmail}, null, 1);
		Screens.showError(sError);
	}

	return mResult;
};

COpenPgp.prototype.isPrivateKeyAvailable = async function ()
{
	await this.oPromiseInitialised;
	let sUserEmail = App.getUserPublicId ? App.getUserPublicId() : '';
	let aPrivateKeys = this.findKeysByEmails([sUserEmail], /*bIsPublic*/false);

	return !!aPrivateKeys.length;
};

COpenPgp.prototype.showPgpErrorByCode = function (oOpenPgpResult, sPgpAction, sDefaultError)
{
	ErrorsUtils.showPgpErrorByCode(oOpenPgpResult, sPgpAction, sDefaultError);
};

/**
 * @param {string} sMessage
 * @param {string} aPrincipalsEmail
 * @param {boolean} bSign
 * @param {string} sPassphrase
 * @param {string} sFromEmail
 * @return {COpenPgpResult}
 */
COpenPgp.prototype.encryptMessage = async function (sMessage, sPrincipalsEmail, bSign, sPassphrase, sFromEmail)
{
	const aEmailForEncrypt = this.findKeysByEmails([sFromEmail], true).length > 0
		? [sPrincipalsEmail, sFromEmail]
		: [sPrincipalsEmail];
	let aPublicKeys = this.findKeysByEmails(aEmailForEncrypt, true);
	let aPrivateKeys = this.findKeysByEmails([sFromEmail], false);
	let oEncryptionResult = await this.encryptData(
		sMessage,
		aPublicKeys,
		aPrivateKeys,
		/*bPasswordBasedEncryption*/false,
		bSign,
		sPassphrase
	);

	if (oEncryptionResult.result)
	{
		let {data, password} = oEncryptionResult.result;
		oEncryptionResult.result = data;
	}

	return oEncryptionResult;
};

module.exports = new COpenPgp();
