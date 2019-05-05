'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout')
;

function getCaretOffset(oElement)
{
    var
        oSel = null,
        oRange = {},
        oPreSelectionRange = {},
        iStart = 0
    ;

    if (window.getSelection && document.createRange)
    {
        oSel = window.getSelection();
        if (oSel.rangeCount > 0)
        {
            oRange = oSel.getRangeAt(0);
            oPreSelectionRange = oRange.cloneRange();
            oPreSelectionRange.selectNodeContents(oElement);
            oPreSelectionRange.setEnd(oRange.startContainer, oRange.startOffset);
            iStart = oPreSelectionRange.toString().length;
			if ($(oElement).html().length < iStart)
			{
				iStart = 0;
			}
        }
    }
    else if (document.selection && document.body.createTextRange)
    {
        oRange = document.selection.createRange();
        oPreSelectionRange = document.body.createTextRange();
        oPreSelectionRange.moveToElementText(oElement);
        if (typeof(oPreSelectionRange.setEndPoint) === 'function')
        {
            oPreSelectionRange.setEndPoint('EndToStart', oRange);
        }
        iStart = oPreSelectionRange.text.length;
    }

    return iStart;
}

function setCursor(oElement, iCaretPos)
{
	var
		range,
		selection,
		textRange
	;
	
	if (!oElement)
	{
		return false;
	}
	else if(document.createRange)
	{
		range = document.createRange();
		range.selectNodeContents(oElement);
		range.setStart(oElement, iCaretPos);
		range.setEnd(oElement, iCaretPos);
		selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}
	else if(oElement.createTextRange)
	{
		textRange = oElement.createTextRange();
		textRange.collapse(true);
		textRange.moveEnd(iCaretPos);
		textRange.moveStart(iCaretPos);
		textRange.select();
		return true;
	}
	else if(oElement.setSelectionRange)
	{
		oElement.setSelectionRange(iCaretPos, iCaretPos);
		return true;
	}
	return false;
}


ko.bindingHandlers.highlighter = {
	'init': function (oElement, fValueAccessor, fAllBindingsAccessor, oViewModel, bindingContext) {

		var
			jqEl = $(oElement),
			oOptions = fValueAccessor(),
			oValueObserver = oOptions.valueObserver ? oOptions.valueObserver : null,
			oHighlighterValueObserver = oOptions.highlighterValueObserver ? oOptions.highlighterValueObserver : null,
			oHighlightTrigger = oOptions.highlightTrigger ? oOptions.highlightTrigger : null,
			aHighlightWords = ['from:', 'to:', 'subject:', 'text:', 'email:', 'has:', 'date:', 'text:', 'body:'],
			rPattern = (function () {
				var sPatt = '';
				$.each(aHighlightWords, function(i, oEl) {
					sPatt = (!i) ? (sPatt + '\\b' + oEl) : (sPatt + '|\\b' + oEl);
				});

				return new RegExp('(' + sPatt + ')', 'g');
			}()),
			fClear = function (sStr) {
				return sStr.replace(/\xC2\xA0/g, ' ').replace(/\xA0/g, ' ').replace(/[\s]+/g, ' ');
			},
			iPrevKeyCode = -1,
			sUserLanguage = window.navigator.language || window.navigator.userLanguage,
			aTabooLang = ['zh', 'zh-TW', 'zh-CN', 'zh-HK', 'zh-SG', 'zh-MO', 'ja', 'ja-JP', 'ko', 'ko-KR', 'vi', 'vi-VN', 'th', 'th-TH'],// , 'ru', 'ru-RU'
			bHighlight = !_.include(aTabooLang, sUserLanguage)
		;

		$(oElement)
			.on('keydown', function (oEvent) {
				return oEvent.keyCode !== Enums.Key.Enter;
			})
			.on('keyup', function (oEvent) {
				var
					aMoveKeys = [Enums.Key.Left, Enums.Key.Right, Enums.Key.Home, Enums.Key.End],
					bMoveKeys = -1 !== $.inArray(oEvent.keyCode, aMoveKeys)
				;
				
				if (!(
						oEvent.keyCode === Enums.Key.Shift					||
						oEvent.keyCode === Enums.Key.Alt					||
						oEvent.keyCode === Enums.Key.Ctrl					||
						// for international english -------------------------
						oEvent.keyCode === Enums.Key.Dash					||
						oEvent.keyCode === Enums.Key.Apostrophe				||
						oEvent.keyCode === Enums.Key.Six && oEvent.shiftKey	||
						// ---------------------------------------------------
						bMoveKeys											||
						((oEvent.ctrlKey || iPrevKeyCode === Enums.Key.Ctrl) && oEvent.keyCode === Enums.Key.a)
					))
				{
					oValueObserver(fClear(jqEl.text()));
					highlight(false);
				}
				iPrevKeyCode = oEvent.keyCode;
				return true;
			})
			.on('paste', function (oEvent) {
				
				if (document.queryCommandSupported('insertText'))
				{
					// cancel paste
					oEvent.preventDefault();

					// get text representation of clipboard
					var sText = '';
					if (oEvent.clipboardData || oEvent.originalEvent.clipboardData)
					{
						sText = (oEvent.originalEvent || oEvent).clipboardData.getData('text/plain');
					}
					else if (window.clipboardData)
					{
						sText = window.clipboardData.getData('Text');
					}
					
					// insert text manually
					document.execCommand('insertText', false, sText);
					
					// insertText command doesn't work in IE
					// paste command causes looping in IE
					// so there is no clearing text in IE for now
				}
				
				setTimeout(function () {
					oValueObserver(fClear(jqEl.text()));
					highlight(false);
				}, 0);
			});

		// highlight on init
		setTimeout(function () {
			highlight(true);
		}, 0);

		function highlight(bNotRestoreSel) {
			if(bHighlight)
			{
				var
					iCaretPos = 0,
					sContent = jqEl.text(),
					aContent = sContent.split(rPattern),
					aDividedContent = [],
					sReplaceWith = '<span class="search_highlight"' + '>$&</span>'
				;
				_.each(aContent, function (sEl) {
					var aEl = sEl.split('');
					if (_.any(aHighlightWords, function (oAnyEl) {return oAnyEl === sEl;}))
					{
						_.each(aEl, function (sElem) {
							aDividedContent.push($(sElem.replace(/(.)/, sReplaceWith)));
						});
					}
					else
					{
						_.each(aEl, function(sElem) {
							if(sElem === ' ')
							{
								// space fix for firefox
								aDividedContent.push(document.createTextNode('\u00A0'));
							}
							else
							{
								aDividedContent.push(document.createTextNode(sElem));
							}
						});
					}
				});
				
				if (!jqEl.is(':focus'))
				{
					// Don't set focus if the field wasn't focused before.
					// It may affect on viewing messages in the list using the up and down buttons.
					jqEl.empty().append(aDividedContent);
				}
				else
				{
					iCaretPos = getCaretOffset(oElement);
					jqEl.empty().append(aDividedContent);
					setCursor(oElement, iCaretPos);
				}
			}
		}

		oHighlightTrigger.notifySubscribers();

		oHighlightTrigger.subscribe(function (bNotRestoreSel) {
			setTimeout(function () {
				highlight(!!bNotRestoreSel);
			}, 0);
		}, this);

		oHighlighterValueObserver.subscribe(function () {
			var
				sElemText = jqEl.text(),
				sValue = oValueObserver()
			;
			if (sElemText.replace('\u00A0', ' ') !== sValue.replace('\u00A0', ' '))
			{
				jqEl.text(sValue);
			}
		}, this);
	}
};

