/*global $, require, module*/

/** @return String */
function HSVtoRGB( h, s, v )
{
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6)
    {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    var hr = Math.floor(r * 255).toString(16);
    var hg = Math.floor(g * 255).toString(16);
    var hb = Math.floor(b * 255).toString(16);
    return '#' + (hr.length < 2 ? '0' : '') + hr +
        (hg.length < 2 ? '0' : '') + hg +
        (hb.length < 2 ? '0' : '') + hb;
}

function openColorPalette(func) {
    var $content = $('<table/>')
        .attr('cellpadding','0')
        .attr('cellspacing','0')
        .attr('unselectable','on');
    for( var row=1; row < 15; ++row ) // should be '16' - but last line looks so dark
    {
        var $rows = $('<tr/>');
        for( var col=0; col < 25; ++col ) // last column is grayscale
        {
            var color;
            if( col == 24 )
            {
                var gray = Math.floor(255 / 13 * (14 - row)).toString(16);
                var hexg = (gray.length < 2 ? '0' : '') + gray;
                color = '#' + hexg + hexg + hexg;
            }
            else
            {
                var hue        = col / 24;
                var saturation = row <= 8 ? row     /8 : 1;
                var value      = row  > 8 ? (16-row)/8 : 1;
                color = HSVtoRGB( hue, saturation, value );
            }
            $('<td/>').addClass('wysiwyg-toolbar-color')
                .attr('title', color)
                .attr('unselectable','on')
                .css({backgroundColor: color})
                .click(function(){
                    var color = this.title;
                    func.apply(this, [color]);
                    return false;
                })
                .appendTo( $rows );
        }
        $content.append( $rows );
    }

    return $content;
}

function openFontSizesList(func) {
    // Hack: http://stackoverflow.com/questions/5868295/document-execcommand-fontsize-in-pixels/5870603#5870603
    var list_fontsizes = [], i;
    for (i = 8; i <= 11; ++i) {
        list_fontsizes.push(i + 'px');
    }
    for (i = 12; i <= 28; i+=2) {
        list_fontsizes.push(i + 'px');
    }
    list_fontsizes.push('36px');
    list_fontsizes.push('48px');
    list_fontsizes.push('72px');
    var $list = $('<div/>')
        .addClass('wysiwyg-plugin-list')
        .attr('unselectable', 'on');
    $.each(list_fontsizes, function(index, size) {
        var $link = $('<a/>')
            .attr('href', '#')
            .html(size)
            .click(function(event) {
                func.apply(this, [size]);
                // prevent link-href-#
                event.stopPropagation();
                event.preventDefault();
                return false;
            });
        $list.append($link);
    });

    return $list;
}

function openLinkConverter(funcOnSave, funcOnCancel, oldHref, oldTarget) {
    // http://bootsnipp.com/forms?version=3
    // http://www.htmlescape.net/stringescape_tool.html

    var formHtml = [
        '<form class="form-horizontal" style="width: 600px; padding: 20px">',
        '    <fieldset>',
        '',
        '        <legend>Создание ссылки</legend>',
        '',
        '        <div class="form-group">',
        '            <label class="col-md-3 control-label" for="href">URL</label>',
        '            <div class="col-md-9">',
        '                <input name="href" placeholder="http://example.com/" class="form-control" required type="text">',
        '',
        '            </div>',
        '        </div>',
        '',
        '        <div class="form-group">',
        '            <label class="col-md-3 control-label" for="targetChoice">Где открывать?</label>',
        '            <div class="col-md-9">',
        '                <select name="targetChoice" class="form-control">',
        '                    <option value="_self">Эта же вкладка</option>',
        '                    <option value="_blank">Новая вкладка</option>',
        '                    <!--<option>Для опытных...</option>-->',
        '                </select>',
        '            </div>',
        '        </div>',
        '',
        '        <div class="form-group" style="display: none">',
        '            <label class="col-md-3 control-label" for="target">ID окна</label>',
        '            <div class="col-md-12">',
        '                <input name="target" class="form-control" type="text">',
        '',
        '            </div>',
        '        </div>',
        '',
        '        <div class="form-group">',
        '            <label class="col-md-3 control-label" for="btnSave"></label>',
        '            <div class="col-md-9">',
        '                <button name="btnSave" class="btn btn-danger">Сохранить</button>',
        '                <button name="btnCancel" class="btn btn-default">Отмена</button>',
        '            </div>',
        '        </div>',
        '',
        '    </fieldset>',
        '</form>'
    ].join("\n");

    var $form = $(formHtml);

    var $href = $form.find("[name='href']");
    $href.val(oldHref);

    if (!oldTarget && !oldHref) {
        oldTarget = '_blank';
    }

    var $target = $form.find("[name='target']");
    $target.val(oldTarget);

    var $targetWrapper = $target.closest(".control-group");
    var $targetChoice = $form.find("[name='targetChoice']");
    $targetChoice.val(oldTarget);

    var funcOnTargetChosen = function(e) {
        console.log($targetChoice.val());
        $target.val($targetChoice.val());
        console.log($target.val());
    };
    $targetChoice
        .keyup(funcOnTargetChosen)
        .change(funcOnTargetChosen);

    $form.find("[name='btnSave']").click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        funcOnSave.apply(this, [$href.val(), $target.val()]);
    });
    $form.find("[name='btnCancel']").click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        funcOnCancel.apply(this, null);
    });

    return $form;
}

function openFileLinkMaker(funcOnSave, funcOnCancel, fileUploadUrl) {
    // http://bootsnipp.com/forms?version=3
    // http://www.htmlescape.net/stringescape_tool.html

    if (typeof fileUploadUrl === typeof undefined) {
        fileUploadUrl = '/upload/file';
    }

    var formHtml = [
        '<div style="position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5); display: table; z-index: 999" class="blackout">',
        '    <div style="display: table-cell; text-align: center; vertical-align: middle">',
        '        <form class="form-horizontal" style="width: 600px; padding: 20px; display: inline-block; text-align: left; background-color: rgba(255, 255, 255, 0.9); border-radius: 3px; border: 1px solid #aaa">',
        '            <fieldset>',
        '',
        '                <legend>Создание ссылки на файл</legend>',
        '',
        '                <div class="form-group">',
        '                    <label class="col-md-3 control-label" for="file">Файл</label>',
        '                    <div class="col-md-9 fileUpload">',
        '                        <div class="input-group">',
        '                            <input name="fileName" class="form-control" type="text" readonly /><!--',
        '                            --><span class="input-group-addon">',
        '                                <span>Обзор...</span>',
        '                            </span>',
        '                        </div>',
        '                        <input class="upload" name="file" type="file" />',
        '',
        '                        <style>',
        '                            .fileUpload {',
        '                                position: relative;',
        '                                overflow: hidden;',
        '                            }',
        '                            .fileUpload input.upload {',
        '                                position: absolute;',
        '                                top: 0;',
        '                                right: 0;',
        '                                margin: 0;',
        '                                padding: 0;',
        '                                font-size: 20px;',
        '                                height: 100%;',
        '                                width: 100%;',
        '                                left: 0;',
        '                                cursor: pointer;',
        '                                opacity: 0;',
        '                                filter: alpha(opacity=0);',
        '                            }',
        '                        </style>',
        '                    </div>',
        '                </div>',
        '',
        '                <div class="form-group">',
        '                    <label class="col-md-3 control-label" for="targetChoice">Где открывать?</label>',
        '                    <div class="col-md-9">',
        '                        <select name="targetChoice" class="form-control">',
        '                            <option value="_self">Эта же вкладка</option>',
        '                            <option value="_blank" selected>Новая вкладка</option>',
        '                            <!--<option>Для опытных...</option>-->',
        '                        </select>',
        '                    </div>',
        '                </div>',
        '',
        '                <div class="form-group" style="display: none">',
        '                    <label class="col-md-3 control-label" for="target">ID окна</label>',
        '                    <div class="col-md-9">',
        '                        <input name="target" class="form-control" type="text" value="_blank">',
        '',
        '                    </div>',
        '                </div>',
        '',
        '                <div class="form-group">',
        '                    <label class="col-md-3 control-label" for="btnSave"></label>',
        '                    <div class="col-md-9">',
        '                        <button name="btnSave" class="btn btn-danger" data-loading-text="<i class=\'fa fa-spin fa-spinner\'></i> Загрузка...">Создать</button>',
        '                        <button name="btnCancel" class="btn btn-default">Отмена</button>',
        '                    </div>',
        '                </div>',
        '',
        '            </fieldset>',
        '        </form>',
        '    </div>',
        '</div>'
    ].join("\n");

    var $form = $(formHtml);

    var $inputUpload = $form.find("[name='file']");
    var $btnSave = $form.find("[name='btnSave']");

    var $target = $form.find("[name='target']");
    var $targetWrapper = $target.closest(".control-group");
    var $targetChoice = $form.find("[name='targetChoice']");

    var funcOnTargetChosen = function(e) {
        console.log($targetChoice.val());
        $target.val($targetChoice.val());
        console.log($target.val());
    };
    $targetChoice
        .keyup(funcOnTargetChosen)
        .change(funcOnTargetChosen);

    $inputUpload.change(function() {
        $form.find("[name='fileName']").val($inputUpload.val());
    });

    $btnSave.click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        var ie9Upload = function() {
            //alert("Браузер не поддерживает HTML5/FormData. Будет использоваться аварийное решение.");

            $btnSave.button('loading');

            var followUpOnIE9Upload = function($tempIframe) {
                var result = $tempIframe.contents().find("body").html();
                $tempIframe.remove();
                funcOnSave.apply(this, [result, $target.val()]);
            };

            var $tempIframe = $("<iframe />");
            $tempIframe.css('display', "none").attr('name', "tempFrameForIE9FileUploadingByAjax");
            var $form = $inputUpload.closest("form");
            $form.attr('action', fileUploadUrl);
            $form.attr('method', "POST");
            $form.attr('enctype', "multipart/form-data");
            $form.attr('encoding', "multipart/form-data");
            $form.attr('target', $tempIframe.attr('name'));
            $form.attr('name', "IE9FileUploadingForm");
            $form.attr('acceptCharset', "UTF-8");
            $tempIframe.get()[0].onload = followUpOnIE9Upload.bind(this, $tempIframe);
            var $container = $form.closest(".blackout");
            $tempIframe.appendTo($container);
            $form.submit();
        };

        try {
            var formData = new FormData();

            if (typeof formData !== typeof undefined) {
                formData.append('file', $inputUpload.get()[0].files.item(0));

                $btnSave.button('loading');

                $.ajax({
                    type: "POST",
                    url: fileUploadUrl,
                    data: formData,
                    dataType: 'text',
                    contentType: false,
                    processData: false,
                    success: function(result, status) {
                        console.log(result);
                        console.log(status);

                        funcOnSave.apply(this, [result, $target.val()]);
                    },
                    error: function(xhr, status, errorText) {
                        console.log(status);
                        console.log(errorText);
                        $btnSave.button('reset');

                        alert("Сожалеем, произошла какая-то ошибка. Попробуйте ещё раз.");
                    }
                });
            } else {
                ie9Upload();
            }
        } catch (e) {
            ie9Upload();
        }
    });

    $form.find("[name='btnCancel']").click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        funcOnCancel.apply(this, null);
    });

    return $form;
}

function openImageInserter(funcOnSave, funcOnCancel, imageUploadUrl) {
    // http://bootsnipp.com/forms?version=3
    // http://www.htmlescape.net/stringescape_tool.html

    if (typeof imageUploadUrl === typeof undefined) {
        imageUploadUrl = '/upload/image';
    }

    var formHtml = [
        '<div style="position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5); display: table; z-index: 999" class="blackout">',
        '    <div style="display: table-cell; text-align: center; vertical-align: middle">',
        '        <form class="form-horizontal" style="width: 800px; padding: 20px; display: inline-block; text-align: left; background-color: rgba(255, 255, 255, 0.9); border-radius: 3px; border: 1px solid #aaa">',
        '            <fieldset>',
        '',
        '                <legend>Вставка картинки</legend>',
        '',
        '                <div class="form-group">',
        '                    <label class="col-md-3 control-label" for="file">Файл</label>',
        '                    <div class="col-md-9 fileUpload">',
        '                        <div class="input-group">',
        '                            <input name="fileName" class="form-control" type="text" readonly /><!--',
        '                            --><span class="input-group-addon">',
        '                                <span>Обзор...</span>',
        '                            </span>',
        '                        </div>',
        '                        <input class="upload" name="image" type="file" />',
        '',
        '                        <style>',
        '                            .fileUpload {',
        '                                position: relative;',
        '                                overflow: hidden;',
        '                            }',
        '                            .fileUpload input.upload {',
        '                                position: absolute;',
        '                                top: 0;',
        '                                right: 0;',
        '                                margin: 0;',
        '                                padding: 0;',
        '                                font-size: 20px;',
        '                                height: 100%;',
        '                                width: 100%;',
        '                                left: 0;',
        '                                cursor: pointer;',
        '                                opacity: 0;',
        '                                filter: alpha(opacity=0);',
        '                            }',
        '                        </style>',
        '                    </div>',
        '                </div>',
        '',
        '                <div class="form-group">',
        '                    <label class="col-md-3 control-label" for="width">Размеры</label>',
        '                    <div class="col-md-9">',
        '                        <div class="input-group">',
        '                            <input name="width" class="form-control" type="text" value="400" /><!--',
        '                            --><span class="input-group-addon"><!--',
        '                                -->x<!--',
        '                            --></span><!--',
        '                            --><input name="height" class="form-control" type="text" disabled /><!--',
        '                            --><span class="input-group-addon">',
        '                                <label for="autoHeight">',
        '                                    <input type="checkbox" id="autoHeight" name="autoHeight" checked />',
        '                                    Сохранить пропорции',
        '                                </label>',
        '                            </span>',
        '                        </div>',
        '                    </div>',
        '                </div>',
        '',
        '                <div class="form-group">',
        '                    <label class="col-md-3 control-label" for="optimization"></label>',
        '                    <div class="col-md-9">',
        '                        <label for="optimization">',
        '                            <input type="checkbox" name="optimization" id="optimization" />',
        '                            Оптимизировать',
        '                        </label>',
        '                    </div>',
        '                </div>',
        '',
        '                <div class="form-group">',
        '                    <label class="col-md-3 control-label" for="wrapByLink"></label>',
        '                    <div class="col-md-9">',
        '                        <label for="wrapByLink">',
        '                            <input type="checkbox" name="wrapByLink" id="wrapByLink" />',
        '                            Открывать в новом окне',
        '                        </label>',
        '                    </div>',
        '                </div>',
        '',
        '                <div class="form-group">',
        '                    <label class="col-md-3 control-label" for="btnInsert"></label>',
        '                    <div class="col-md-9">',
        '                        <button name="btnInsert" class="btn btn-danger" data-loading-text="<i class=\'fa fa-spin fa-spinner\'></i> Загрузка...">Вставить</button>',
        '                        <button name="btnCancel" class="btn btn-default">Отмена</button>',
        '                    </div>',
        '                </div>',
        '',
        '            </fieldset>',
        '        </form>',
        '    </div>',
        '</div>'
    ].join("\n");

    var $form = $(formHtml);
    var $inputUpload = $form.find("[name='image']");
    var $width = $form.find("[name='width']");
    var $height = $form.find("[name='height']");
    var $autoHeight = $form.find("[name='autoHeight']");
    var $optimization = $form.find("[name='optimization']");
    var $wrapByLink = $form.find("[name='wrapByLink']");
    var $btnInsert = $form.find("[name='btnInsert']");

    $inputUpload.change(function() {
        $form.find("[name='fileName']").val($inputUpload.val());
    });

    $autoHeight.click(function() {
        $height.prop('disabled', $autoHeight.is(':checked'));
    });

    $btnInsert.click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        var width, height;

        width = $width.val();
        height = $height.val();

        var $optimizationChosen = $form.find("[name='optimization']:checked");

        if ($autoHeight.is(':checked')) {
            height = 0;
        }

        var openInNewTab = $wrapByLink.prop('checked');

        var ie9Upload = function() {
            //alert("Браузер не поддерживает HTML5/FormData. Будет использоваться аварийное решение.");

            $btnInsert.button('loading');

            var followUpOnIE9Upload = function($tempIframe) {
                var result = $tempIframe.contents().find("body").html();
                $tempIframe.remove();
                if ($autoHeight.is(':checked')) {
                    height = 0;
                } else {
                    height += 'px';
                }

                // handle errors
                if (result == "Wrong file extension.") {
                    alert("Неправильное расширение файла.");
                    $btnInsert.button('reset');
                } else {
                    funcOnSave.apply(this, [result, width + 'px', height, openInNewTab]);
                }
            };

            var $tempIframe = $("<iframe />");
            $tempIframe.css('display', "none").attr('name', "tempFrameForIE9FileUploadingByAjax");
            var $form = $inputUpload.closest("form");
            $form.attr('action', imageUploadUrl);
            $form.attr('method', "POST");
            $form.attr('enctype', "multipart/form-data");
            $form.attr('encoding', "multipart/form-data");
            $form.attr('target', $tempIframe.attr('name'));
            $form.attr('name', "IE9FileUploadingForm");
            $form.attr('acceptCharset', "UTF-8");

            if ($optimizationChosen.val() == "1") {
                var $inputWidth = $("<input />");
                $inputWidth.attr('name', "width");
                $inputWidth.attr('type', "hidden");
                $inputWidth.val(width);
                $inputWidth.appendTo($form);

                if (!$autoHeight.is(':checked')) {
                    var $inputHeight = $("<input />");
                    $inputHeight.attr('name', "height");
                    $inputHeight.attr('type', "hidden");
                    $inputHeight.val(height);
                    $inputHeight.appendTo($form);
                }
            }

            $tempIframe.get()[0].onload = followUpOnIE9Upload.bind(this, $tempIframe);
            var $container = $form.closest(".blackout");
            $tempIframe.appendTo($container);
            $form.submit();
        };

        $btnInsert.button('loading');

        try {
            var formData = new FormData();

            if (typeof formData !== typeof undefined) {
                formData.append('image', $inputUpload.get()[0].files.item(0));

                if ($optimizationChosen.is(':checked')) {
                    formData.append('width', width);
                    if (!$autoHeight.is(':checked')) {
                        formData.append('height', height);
                    }
                }

                $.ajax({
                    type: "POST",
                    url: imageUploadUrl,
                    data: formData,
                    dataType: 'text',
                    contentType: false,
                    processData: false,
                    success: function (result, status) {
                        console.log(result);
                        console.log(status);

                        if ($autoHeight.is(':checked')) {
                            height = 0;
                        } else {
                            height += 'px';
                        }

                        // handle errors
                        if (result == "Wrong file extension.") {
                            alert("Неправильное расширение файла.");
                            $btnInsert.button('reset');
                        } else {
                            funcOnSave.apply(this, [result, width + 'px', height, openInNewTab]);
                        }
                    },
                    error: function (xhr, status, errorText) {
                        console.log(status);
                        console.log(errorText);
                        $btnInsert.button('reset');

                        alert("Сожалеем, произошла какая-то ошибка. Попробуйте ещё раз.");
                    }
                });
            } else {
                ie9Upload();
            }
        } catch(e) {
            ie9Upload();
        }
    });
    $form.find("[name='btnCancel']").click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        funcOnCancel.apply(this, null);
    });

    return $form;
}

module.exports = {
    HSVtoRGB: HSVtoRGB,
    openColorPalette: openColorPalette,
    openFontSizesList: openFontSizesList,
    openLinkConverter: openLinkConverter,
    openFileLinkMaker: openFileLinkMaker,
    openImageInserter: openImageInserter
};
