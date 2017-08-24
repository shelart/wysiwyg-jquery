/*global $, require, module*/
var $ = require('jquery');
var wysiwyg = require('wysiwyg-js');
var wysiwygEditor = require('./wysiwyg-editor');
//wysiwygEditor(window, document, $);

function makeWysisyg($wysiwyg) {
    function wysiwygBold($wysiwyg) {
        $wysiwyg.wysiwyg('shell').bold();
        wysiwygReplaceTag($wysiwyg, "b", "strong");
        window.edited = true;
    }

    function wysiwygItalic($wysiwyg) {
        $wysiwyg.wysiwyg('shell').italic();
        wysiwygReplaceTag($wysiwyg, "i", "em");
        window.edited = true;
    }

    function wysiwygUnlink($wysiwyg) {
        document.execCommand('unlink', false, false);
        $wysiwyg.wysiwyg('shell').sync();
        window.edited = true;
    }

    function wysiwygReplaceTag($wysiwyg, oldSelector, newTag, processFunc) {
        $wysiwyg
            .wysiwyg('container')
            .find(oldSelector)
            .replaceWith(function() {
                //console.log($(this));
                var $result = $("<" + newTag + " />", {
                    html: $(this).html()
                });
                if (processFunc) {
                    processFunc.apply(this, [$result]);
                }
                return $result;
            });
        window.edited = true;
    }

    // http://stackoverflow.com/a/6691294
    function placeHtmlAtCaret(html, selectPastedContent) {
        var sel, range;
        if (window.getSelection) {
            // IE9 and non-IE
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                // Range.createContextualFragment() would be useful here but is
                // only relatively recently standardized and is not supported in
                // some browsers (IE9, for one)
                var el = document.createElement("div");
                el.innerHTML = html;
                var frag = document.createDocumentFragment(), node, lastNode;
                while ( (node = el.firstChild) ) {
                    lastNode = frag.appendChild(node);
                }
                var firstNode = frag.firstChild;
                range.insertNode(frag);

                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    if (selectPastedContent) {
                        range.setStartBefore(firstNode);
                    } else {
                        range.collapse(true);
                    }
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        } else if ( (sel = document.selection) && sel.type != "Control") {
            // IE < 9
            var originalRange = sel.createRange();
            originalRange.collapse(true);
            sel.createRange().pasteHTML(html);
            if (selectPastedContent) {
                range = sel.createRange();
                range.setEndPoint("StartToStart", originalRange);
                range.select();
            }
        }
    }

    $wysiwyg.wysiwyg({
        toolbar: "top-selection",
        buttons: {
            bold: {
                title: 'Полужирный (Ctrl+B)',
                image: '\uf032',
                click: function($button) {
                    wysiwygBold($wysiwyg);
                },
                showstatic: true,
                showselection: true
            },
            italic: {
                title: 'Курсив (Ctrl+I)',
                image: '\uf033',
                click: function($button) {
                    wysiwygItalic($wysiwyg);
                },
                showstatic: true,
                showselection: true
            },
            forecolor: {
                title: 'Цвет текста',
                image: '\uf1fc',
                popup: function($popup, $button) {
                    $popup.append(openColorPalette(function(color) {
                        $wysiwyg.wysiwyg('shell').forecolor(color).closePopup().collapseSelection();
                        wysiwygReplaceTag($wysiwyg, "font[color]", "span", function($result) {
                            $result.css('color', color);
                        });
                    }));
                },
                showstatic: true,
                showselection: true
            },
            insertlink: {
                title: 'Преобразовать в ссылку',
                image: '\uf0c1',
                popup: function($popup, $button) {
                    var selectedNodes = getSelectedNodes();

                    var $selectedNodes = [];
                    $.each(selectedNodes, function(idx, node) {
                        $selectedNodes[$selectedNodes.length] = $(node);
                    });
                    $selectedNodes = $($selectedNodes).map(function() {
                        return this.toArray();
                    });

                    var $oldLink = $selectedNodes.closest("a");
                    var oldHref, oldTarget;
                    if ($oldLink.length) {
                        oldHref = $oldLink.attr('href');
                        oldTarget = $oldLink.attr('target');
                    } else {
                        console.log($selectedNodes);
                        var $oldImg = $selectedNodes.find("img");
                        if ($oldImg.length) {
                            oldHref = $oldImg.attr('src');
                            oldTarget = "_blank";
                        }
                    }

                    if (typeof oldHref === typeof undefined) {
                        oldHref = "";
                    }

                    if (typeof oldTarget === typeof undefined) {
                        oldTarget = "";
                    }

                    $popup.append(openLinkConverter(function(href, target) {
                        var dummyHref;
                        do {
                            dummyHref = randomString(10, 10);
                        } while ($wysiwyg.wysiwyg('container').find("a[href='" + dummyHref + "']").length);

                        $wysiwyg.wysiwyg('shell').insertLink(dummyHref).closePopup();
                        var $link = $wysiwyg
                            .wysiwyg('container')
                            .find("a[href='" + dummyHref + "']");
                        $link.attr('href', href);
                        if (target != "") {
                            $link.attr('target', target);
                        }
                        window.edited = true;
                    }, function() {
                        $wysiwyg.wysiwyg('shell').closePopup();
                    }, oldHref, oldTarget));
                },
                showstatic: false,
                showselection: true
            },
            unlink: {
                title: 'Удалить ссылку',
                image: '\uf127',
                click: function($button) {
                    wysiwygUnlink($wysiwyg);
                },
                showstatic: false,
                showselection: true
            },
            insertimage: {
                title: 'Вставить картинку',
                image: '\uf030',
                popup: function($popup, $button) {
                    $popup.append(openImageInserter(function(src) {
                        var dummySrc;
                        do {
                            dummySrc = randomString(10, 10);
                        } while ($wysiwyg.wysiwyg('container').find("img[src='" + dummySrc + "']").length);

                        $wysiwyg.wysiwyg('shell').insertImage(dummySrc).closePopup();

                        var $image = $wysiwyg
                            .wysiwyg('container')
                            .find("img[src='" + dummySrc + "']");

                        $image.attr('src', src);

                        window.edited = true;
                    }, function() {
                        $wysiwyg.wysiwyg('shell').closePopup();
                    }));
                },
                showstatic: true,
                showselection: false
            },
            insertJournalUpdatePane: {
                title: 'Вставить журнальную плашку',
                image: 'Ж',
                popup: function($popup, $button) {
                    $popup.append(openJournalUpdatePaneInserter(function($div) {
                        var dummySrc;
                        do {
                            dummySrc = randomString(10, 10);
                        } while ($wysiwyg.wysiwyg('container').find("img[src='" + dummySrc + "']").length);

                        $wysiwyg.wysiwyg('shell').insertImage(dummySrc).closePopup();

                        var $image = $wysiwyg
                            .wysiwyg('container')
                            .find("img[src='" + dummySrc + "']");

                        $div.insertAfter($image);
                        $image.remove();
                        if (!$div.parent().is('#contents')) {
                            $div.appendTo($('#contents'));
                        }
                        var $p = $('<p><br /></p>').insertAfter($div);
                        var p = $p.get(0);
                        var br = p.firstChild;

                        if (window.getSelection) {
                            var sel = window.getSelection();
                            if (sel.getRangeAt && sel.rangeCount) {
                                var range = document.createRange();
                                range.setStart(br, 0);
                                range.setEnd(br, 0);
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                        }

                        window.edited = true;
                    }, function() {
                        $wysiwyg.wysiwyg('shell').closePopup();
                    }));
                },
                showstatic: true,
                showselection: false
            },
            deleteJournalUpdatePane: {
                title: 'Удалить журнальную плашку',
                image: '<s>Ж</s>',
                click: function($button) {
                    var node = window.getSelection().getRangeAt(0).commonAncestorContainer;
                    var $node = $(node);
                    var $journalUpdate = $node.closest('.journal-update');
                    if ($journalUpdate.length) {
                        $journalUpdate.remove();
                    } else {
                        alert('Нет плашки для удаления');
                    }
                },
                showstatic: false,
                showselection: true
            },
            insertfile: {
                title: 'Сделать ссылкой на файл',
                image: '\uf15b',
                popup: function($popup, $button) {
                    $popup.append(openFileLinkMaker(function(href, target) {
                        var dummyHref;
                        do {
                            dummyHref = randomString(10, 10);
                        } while ($wysiwyg.wysiwyg('container').find("a[href='" + dummyHref + "']").length);

                        $wysiwyg.wysiwyg('shell').insertLink(dummyHref).closePopup();
                        var $link = $wysiwyg
                            .wysiwyg('container')
                            .find("a[href='" + dummyHref + "']");
                        $link.attr('href', href);
                        if (target != "") {
                            $link.attr('target', target);
                        }
                        window.edited = true;
                    }, function() {
                        $wysiwyg.wysiwyg('shell').closePopup();
                    }));
                },
                showstatic: false,
                showselection: true
            },
            removeformat: {
                title: 'Сбросить форматирование',
                image: '\uf12d',
                showstatic: false,
                showselection: true
            },
        },
        submit: {
            title: 'OK',
            image: '\uf00c'
        },
        onKeyPress: function(key, character, shiftKey, altKey, ctrlKey, metaKey) {
            /*console.log({
             key: key,
             character: character,
             shiftKey: shiftKey,
             altKey: altKey,
             ctrlKey: ctrlKey,
             metaKey: metaKey
             });
             */
            if (typeof $wysiwyg.data('keyPressUserFunc') !== typeof undefined) {
                $wysiwyg.data('keyPressUserFunc').apply(this, [key, character, shiftKey, altKey, ctrlKey, metaKey]);
            }

            window.edited = true;

            console.log({
                key: key,
                character: character,
                shiftKey: shiftKey,
                altKey: altKey,
                ctrlKey: ctrlKey,
                metaKey: metaKey
            });

            if ((character == "b") && (ctrlKey) && (!altKey) && (!shiftKey) && (!metaKey)) {
                wysiwygBold($wysiwyg);
                return false;
            } else if ((character == "i") && (ctrlKey) && (!altKey) && (!shiftKey) && (!metaKey)) {
                wysiwygItalic($wysiwyg);
                return false;
            } else if ((key == 13) && (!ctrlKey) && (!altKey) && (shiftKey) && (!metaKey)) {
                placeHtmlAtCaret("<br />", false);
                return false;
                /*} else if ((key == 13) && (!ctrlKey) && (!altKey) && (shiftKey) && (!metaKey)) {
                 wrapRootTextNodesIntoParagraphs($wysiwyg);
                 return true;*/
            } else {
                return true;
            }
        },
        placeholderUrl: '',
        selectImage: 'Перетащите сюда изображение или щелкните здесь',
        //maxImageSize: [600, 200],
        forceImageUpload: true,    // upload images even if File-API is present
        onImageUpload: function(insert_image) {
            // A bit tricky, because we can't easily upload a file via
            // '$.ajax()' on a legacy browser without XMLHttpRequest2.
            // You have to submit the form into an '<iframe/>' element.
            // Call 'insert_image(url)' as soon as the file is online
            // and the URL is available.
            var iframe_name = 'legacy-uploader-' + Math.random().toString(36).substring(2);
            $('<iframe>')
                .attr('name', iframe_name)
                .load(function() {
                    // <iframe> is ready - we will find the URL in the iframe-body
                    var iframe = this;
                    var iframedoc = iframe.contentDocument ? iframe.contentDocument :
                        (iframe.contentWindow ? iframe.contentWindow.document : iframe.document);
                    var iframebody = iframedoc.getElementsByTagName('body')[0];
                    var image_url = iframebody.innerHTML;
                    insert_image(image_url);
                    $(iframe).remove();
                })
                .appendTo(document.body);
            var $input = $(this);
            $input
                .attr('name', 'upload-filename')
                .parents('form')
                .attr('action', "/uploadImage")// TODO: image uploader
                .attr('method', 'POST')
                .attr('enctype', 'multipart/form-data')
                .attr('target', iframe_name)
                .submit();
        },
    });

    $wysiwyg.on('paste.clearFormat', function(e) {
        var pastedData;
        console.log(e.originalEvent.clipboardData);
        pastedData = e.originalEvent.clipboardData.getData('text/plain');
        console.log(pastedData);
        // Parse pasted data to paragraphs
        var paragraphs = pastedData.split('\n');
        var html = '';
        paragraphs.forEach(function(p, idx) {
            if (idx > 0) {
                html += '<p>';
            }
            html += p + '</p>';
        });
        // http://stackoverflow.com/a/2925633
        // https://stackoverflow.com/a/3599599/2175025
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                // the selection is cleared
                // so we might be inside a <p> with 0-length range
                // find <p> outside
                var rangeParentNode = range.startContainer.parentElement;
                if (
                    rangeParentNode
                    && rangeParentNode.nodeType === Node.ELEMENT_NODE
                    && rangeParentNode.tagName === 'P'
                ) {
                    // yes, we're inside <p>
                    // keep the leading offset
                    var offsetBeforePaste = range.startOffset;
                    // keep the trailing to form the last paragraph
                    var trailing = rangeParentNode.innerHTML.substring(range.startOffset);
                    // remember the length of the first pasted paragraph
                    var firstPastedParagraphLength = paragraphs[0].length;
                    // append the first pasted paragraph to the end of this one
                    // and cut off the trailing
                    rangeParentNode.innerHTML = rangeParentNode.innerHTML.substring(0, range.startOffset) + paragraphs.shift();
                    // add rest new paragraphs with the stored trailing
                    if (paragraphs.length) {
                        var lastPastedParagraphLength;
                        var $lastInsertedParagraph = $(rangeParentNode);
                        paragraphs.forEach(function (str, idx) {
                            var content = str;
                            if (idx === paragraphs.length - 1) {
                                // remember the length
                                lastPastedParagraphLength = content.length;
                                // restore the trailing
                                content += trailing;
                            }
                            var $p = $('<p>' + content + '</p>');
                            $p.insertAfter($lastInsertedParagraph);
                            $lastInsertedParagraph = $p;
                        });
                        lastP = $lastInsertedParagraph.get(0);

                        if (lastP.childNodes.length) {
                            range.setStart(lastP.childNodes[0], lastPastedParagraphLength);
                            range.setEnd(lastP.childNodes[0], lastPastedParagraphLength);
                        } else {
                            // last <p> is empty
                            range.setStart(lastP, 0);
                            range.setEnd(lastP, 0);
                        }
                    } else {
                        // there is no paragraphs to paste left
                        // so restore the trailing to the current one
                        rangeParentNode.innerHTML += trailing;
                        lastP = rangeParentNode;
                        range.setStart(lastP.childNodes[0], offsetBeforePaste + firstPastedParagraphLength);
                        range.setEnd(lastP.childNodes[0], offsetBeforePaste + firstPastedParagraphLength);
                    }

                    sel.removeAllRanges();
                    sel.addRange(range);
                } else {
                    // we're somewhere in the ass
                    // use an algorithm from StackOverflow
                    var tmp = document.createElement('div');
                    tmp.innerHTML = html;
                    var frag = document.createDocumentFragment();
                    var p, lastP;
                    while ((p = tmp.firstChild)) {
                        lastP = frag.appendChild(p);
                    }
                    range.insertNode(frag);
                    range.setStartAfter(lastP);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        } else if (document.selection && document.selection.createRange) {
            document.selection.createRange().pasteHTML(html);
        }

        window.edited = true;
        e.preventDefault();
    });

    function nextNode(node) {
        if (node.hasChildNodes()) {
            return node.firstChild;
        } else {
            while (node && !node.nextSibling) {
                node = node.parentNode;
            }
            if (!node) {
                return null;
            }
            return node.nextSibling;
        }
    }

    function getRangeSelectedNodes(range) {
        var node = range.startContainer;
        var endNode = range.endContainer;

        // Special case for a range that is contained within a single node
        if (node == endNode) {
            return [node];
        }

        // Iterate nodes until we hit the end container
        var rangeNodes = [];
        while (node && node != endNode) {
            rangeNodes.push( node = nextNode(node) );
        }

        // Add partially selected nodes at the start of the range
        node = range.startContainer;
        while (node && node != range.commonAncestorContainer) {
            rangeNodes.unshift(node);
            node = node.parentNode;
        }

        return rangeNodes;
    }

    function getSelectedNodes() {
        if (window.getSelection) {
            var sel = window.getSelection();
            if (!sel.isCollapsed) {
                return getRangeSelectedNodes(sel.getRangeAt(0));
            }
        }
        return [];
    }
}

module.exports = makeWysisyg;
