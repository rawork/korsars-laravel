(function($) {
    $(function() {

        $.cachedScript = function( url, options ) {

            // Allow user to set any option except for dataType, cache, and url
            var options = $.extend( options || {}, {
                dataType: "script",
                cache: true,
                url: url
            });

            // Use $.ajax() since it is more flexible than $.getScript
            // Return the jqXHR object so we can chain callbacks
            return jQuery.ajax( options );
        };

        var $body = $('body');
        window.state = $body.attr('data-state');
        window.theme_ref = $body.attr('data-theme');
        window.prj_ref = $body.attr('data-ref');

        var showPopup = function() {
            $('#modalDialog').modal('show');
        };

        var hidePopup = function() {
            $('#modalDialog').modal('hide');
        };

        $(document).on('click', '.btn-submit', function (e) {
            var mode = parseInt($(this).attr('data-mode'));

            if (mode) {
                $('input#utype').val(mode);
            }

            $('#entityForm').submit();
        });

        $(document).on('click', '#state-menu-icon', function(e){
            e.preventDefault();

            var that = $(this);

            if ($('.statebar').css('left') == '-260px') {
                $('.navbar-fixed-top,.navbar-fixed-bottom').css({position: 'static', 'margin-left': '-15px', 'margin-right': '-15px'});
                $('.container').css({'position': 'absolute', 'padding-top': '0', 'padding-bottom': '0'})
                    .animate({
                        left: '260px'
                    }, 200);

                $('body').css('overflow-x', 'hidden');

                $('.statebar').animate({
                    left: '0px'
                }, 200);
                //that.hide();
            } else {
                $('.navbar-fixed-top,.navbar-fixed-bottom').css({position: 'fixed', 'margin-left': '0', 'margin-right': '0'});
                $('.container')
                    .animate({
                        left: 'auto'
                    }, 200)
                    .css({'position': 'static', 'padding-top': '70px', 'padding-bottom': '40px'});

                $('.statebar').animate({
                    left: '-260px'
                }, 200);
                //that.show();
            }
        });

        $(document).on('click', '.statebar a.close', function(e) {
            e.preventDefault();

            $('#state-menu-icon').trigger('click');
        });

        $(document).on('click', '.btn-select-dialog', function (e){
            e.preventDefault();

            var that = $(this);
            var input = that.attr('data-input');
            var table = that.attr('data-table');
            var field = that.attr('data-field');
            var value = that.attr('data-value');
            var title = that.attr('data-title');
            var url = that.attr('data-url');

            $.post(url, {input: input, table: table, field: field, value: value, title : title},
                function(data){
                    $('#popupTitle').html(data.title);
                    $('#popupButtons').html(data.button);
                    $('#popupContent').html(data.content);
                    $('.popup-item').on("click", function(event){
                        $('#popupChoiceId').val($(this).prop('rel'));
                        $('#popupChoiceTitle').html($(this).html());
                    });
                    showPopup();
                }, "json");
        });

        $(document).on('click', '.btn-tree-dialog', function (e){
            e.preventDefault();

            var that = $(this);
            var input = that.attr('data-input');
            var table = that.attr('data-table');
            var field = that.attr('data-field');
            var value = that.attr('data-value');
            var title = that.attr('data-title');
            var url = that.attr('data-url');

            $.post(url, {input: input, table: table, field: field, value: value, title : title},
                function(data){
                    $('#popupTitle').html(data.title);
                    $('#popupButtons').html(data.button);
                    $('#popupContent').html(data.content);
                    $("#navigation").treeview({
                        persist: "location",
                        collapsed: true,
                        unique: true
                    });
                    $('.popup-item').on("click", function(event){
                        $('#popupChoiceId').val($(this).prop('rel'));
                        $('#popupChoiceTitle').html($(this).html());
                    });
                    showPopup();
                }, "json");
        });

        $(document).on('click', '.btn-popup-choice', function (e) {
            e.preventDefault();

            var inputId = $(this).attr('data-input');
            var value = $('#popupChoiceId').val();
            var valueTitle = $('#popupChoiceTitle').html();
            var type = $('#'+inputId+'_type').val();

            if (type == 'many') {
                var text = '<div>'+valueTitle+' <input type="radio" name="'+inputId+'_default" value="'+value+'" class="selected-default" data-input-id="'+inputId+'"> По умолчанию <a href="#" class="selected-remove" data-input="'+inputId+'"><span class="glyphicon glyphicon-remove"></span></a></div>';

                if ($('input[name|="'+inputId+'_default"]').length == 0) {
                    $('#'+inputId+'_title').html(text);
                    $('#'+inputId).val(value);
                    $('input[name|="'+inputId+'_default"]').first().prop('checked', true);
                } else {
                    $('#'+inputId+'_title').append(text);
                }
                ids = [];
                $('input[name|="'+inputId+'_default"]').each(function (index, domElement){
                    if ($(domElement).val() != $('#'+inputId).val()) {
                        ids.push($(domElement).val());
                    }
                });
                $('#'+inputId+'_extra').val(ids.join());
            } else {
                $('#'+inputId).val(value);
                text = '<div>'+valueTitle+' <a href="#" class="selected-remove" data-input="'+inputId+'"><i class="glyphicon glyphicon-remove"></i></a></div>';
                $('#'+inputId+'_title').html(text);
            }
            hidePopup();
        });

        $(document).on('click', '.btn-list-choice', function (e) {
            e.preventDefault();
            var input_id = $(this).attr('data-input');
            var ids = [];
            var titles = [];
            $("input.popup-item:checked").each(function (index, domElement) {
                var id = $(domElement).val();
                var title = $('#itemTitle' + id).html();
                ids.push(id);
                titles.push(title);
            });
            $('#'+input_id).val(ids.join());
            $('#'+input_id+'_title').val(titles.join(', '));
            hidePopup();
        });

        $(document).on('click', '.modal-body .pagination a', function (e) {
            e.preventDefault();

            var url = $(this).attr('href');

            $.get(url,
                function(data){
                    $('#selectlist').html(data.content);
                    $('.popup-item').on("click", function(event){
                        $('#popupChoiceId').val($(this).prop('rel'));
                        $('#popupChoiceTitle').html($(this).html());
                    });
                }, "json");
        });

        $(document).on('click', '#btn-filter-cancel', function(e) {
            e.preventDefault();
            $('#filter-type').val($(this).attr('data-type'));
            $('#form-filter').submit();
        });

        $(document).on('click', '#btn-group-delete', function(e) {
            e.preventDefault();
            var elements = $(".list-checker:checked");
            if (elements.length <= 0) {
                alert('Не выбраны элементы для удаления');
                return false;
            }

            if (confirm('Уверены, что хотите удалить выделенные записи?')) {
                var ids = new Array();
                elements.each(function (index, domElement) {
                    var id = $(domElement).val();
                    ids.push(id);
                });
                $('#ids').val(ids.join());
                var path = location.href.split('?');
                $('#frmGroupUpdate').prop('action', path[0] + '/groupdelete').submit();
            }

            return false;
        });

        $(document).on('click', '#btn-group-save, #btn-group-edit', function(e) {
            e.preventDefault();

            var checkElements = $(this).attr('data-check') == 'true';
            var elements = $(".list-checker:checked");

            if (checkElements && elements.length <= 0) {
                alert('Не выбраны элементы для редактирования');
                return;
            }

            if (checkElements) {
                var ids = new Array();
                elements.each(function (index, domElement) {
                    var id = $(domElement).val();
                    ids.push(id);
                });
                $('input[name="edited"]').val(0);
                $('#ids').val(ids.join());
            }

            $('#frmGroupUpdate').submit();

        });

        $('input.clPicker').colorPicker();

        $(document).on('click', 'a.state', function () {
            $('#waiting').show(0);
            var url = $(this).attr('data-url');

            $.post(url, {},
                function(data){
                    if (data.error) {
                        window.location.reload();
                        return;
                    }

                    $('#module-menu').html(data.content);
                    $('#waiting').hide(0);

                    console.log($('.statebar').css('left'));

                    if ($('.statebar').css('left') == '-260px') {
                        if ('static' != $('.navbar-fixed-top').css('position')) {
                            $('.navbar-fixed-top,.navbar-fixed-bottom').css({position: 'static', 'margin-left': '-15px', 'margin-right': '-15px'});
                        }

                        $('body>.container').css({'position': 'absolute', 'padding-top': '0', 'padding-bottom': '0'})
                            .animate({
                                left: '260px'
                            }, 200);
                        $('body').css('overflow-x', 'hidden');
                        $('.statebar').animate({
                            left: '0px'
                        }, 200);
                        //that.hide();
                    }



                    //if ($('.statebar').css('left') == '-260px') {
                    //    $('body').css('position', 'absolute')
                    //        .animate({
                    //            right: '-260px'
                    //        }, 200);
                    //
                    //    $('.statebar').animate({
                    //        left: '0px'
                    //    }, 200);
                    //    $('#state-menu-icon').hide();
                    //}
                }, "json");
        });

        $(document).on('click', 'a.module', function (e) {
            e.preventDefault();

            $('#waiting').show();

            var url = $(this).attr('data-url');
            var tablelist = $(this).siblings('.admin-submenu');

            if (tablelist.html() == '') {
                $.post(url, {},
                    function(data){
                        if (data.alertText) {
                            window.location.reload();
                        } else {
                            tablelist.html(data.content);
                            tablelist.show();
                        }
                        $('#waiting').hide();
                    }, "json");
            } else if (tablelist.css('display') == 'none') {
                tablelist.show();
                $('#waiting').hide();
            } else {
                tablelist.hide();
                $('#waiting').hide();
            }
        });

        $(document).on('change', '#select-rpp', function (e) {
            $('#waiting').show();
            var that = $(this);
            var tableName = that.attr('data-table');
            var url = that.attr('data-url');
            var rpp = that.val();
            $.post(url, {table: tableName, rpp: rpp},
                function(data){
                    $('#waiting').hide();
                    window.location.reload();
                }, "json");
        });

        $(document).on('click', '.entity-delete-link', function (e) {
            e.preventDefault();
            var url = $(this).attr('data-url');
            if (confirm('Уверены, что хотите удалить запись?')) {
                window.location.href = url;
            } else {
                return false;
            }
        });

        $(document).on('click', '.entity-copy-link', function (e) {
            e.preventDefault();

            var url = $(this).attr('data-url');
            $.post(url, {},
                function(data){
                    $('#popupTitle').html(data.title);
                    $('#popupButtons').html(data.button);
                    $('#popupContent').html(data.content);
                    showPopup();
                }, "json");
        });

        $(document).on('click', '.btn-copy', function (e) {

            var ref = '/' + $(this).attr('data-id') + '/copy';
            var quantity = parseInt($('#copy-amount').val());

            if (quantity > 0 && quantity < 11) {
                hidePopup();
                var path = location.href.split('?');
                window.location = path[0] + ref + '/' + quantity + (1 in path ? '?'+ path[1] : '');
            } else {
                $('#copy-input').addClass('has-error');
                $('#copy-help').html('Введите число от 1 до 10');
            }
        });

        $('.btn-create-backup').bind('click', function() {
            var url = $(this).attr('data-url');
            $('#waiting').show();
            $("#archive_info").addClass('closed').empty();
            $.post(url, {},
                function(data){
                    $('#waiting').hide();
                    window.location.reload();
                }, "json");
        });

        $('.btn-clear-cache').bind('click', function() {
            var url = $(this).attr('data-url');
            $('#waiting').show();
            $("#cache_info").addClass('closed').empty();
            $.post(url, {},
                function(data){
                    $("#cache_info").html(data.content).removeClass('closed');
                    $('#waiting').hide();
                }, "json");
        });

        $(document).on('click', '.delete', function (e) {
            e.preventDefault();

            var id = $(this).attr('data-id');
            var url = $(this).attr('data-url');

            $.post(url, {id: id},
                function(data){
                    if (data.error) {
                        alert(data.error);
                    } else {
                        $('#file_'+id).remove();
                    }
                }, "json");
        });

        $('.btn-add-input').bind('click', function() {
            var name = $(this).attr('data-name');
            $('#'+name+'_input').append('<br><input name="'+name+'[]" type="file">');
        });

        $('.select-type').bind('change', function (){
            var types = ['image', 'gallery', 'enum', 'select', 'select_list', 'select_tree', 'structure'];
            var type = $(this).val();

            if ($.inArray(type, types) > -1) {
                $('#add_select_values').css('display', 'table-row');
                $('#add_params').css('display', 'table-row');
            } else {
                $('#add_select_values').hide();
                $('#add_params').hide();
            }
        });


        $('.multi').MultiFile({
            accept:'jpg|gif|png|rar|zip|pdf|flv|ppt|xls|doc',
            max:10,
            remove:'удалить',
            file:'$file',
            selected:'Выбраны: $file',
            denied:'Неверный тип файла: $ext!',
            duplicate:'Этот файл уже выбран:\n$file!'
        });

        $("#waiting").ajaxStart(function(){
            $(this).show();
        })
            .ajaxComplete(function(){
                $(this).hide();
            });

        $('#uploadForm').ajaxForm({
            beforeSubmit: function(a,f,o) {
                o.dataType = "html";
                $('#uploadOutput').html('Отправка данных...');
            },
            success: function(data) {
                var out = $('#uploadOutput');
                out.html('');
                if (typeof data == 'object' && data.nodeType)
                    data = elementToString(data.documentElement, true);
                else if (typeof data == 'object')
                    data = objToString(data);
                out.append('<div>'+ data +'</div>');
                $('a.MultiFile-remove').click();
                $('#updatelistbtn').click();
            }
        });

        $('#list-checker').on('click', function () {
            if ($(this).prop('checked')) {
                $(".list-checker").prop('checked', true);
            } else {
                $(".list-checker").prop('checked', false);
            }
        });

        $('a.filemanager-link').click(function(e){
            e.preventDefault();
            var that = $(this);
            var iframe = $('<iframe frameborder="0"></iframe>');
            iframe.attr('src', that.attr('href'));
            $('#popupContent').html(iframe[0].outerHTML);
            $('#popupTitle').html(that.html());
            $('.modal-content').css('width', '800px');
            $('.modal-body').css('padding', '0');
            $('.modal-footer').css('margin-top', '0');
            $('.modal-footer').css('padding', '0');
            $('#modalDialog').modal({show:true});

        })

        $(document).on('click', 'a.locale', function(){
            $('#formLocale input[name=locale]').val($(this).attr('data-locale'));
            $('#formLocale').submit();
        });

        $(document).on('click', '.selected-default', function(e){
            var that = $(this);
            var inputId = that.attr('data-input-id');
            if (that.prop('checked')) {
                $('#'+inputId).val(that.val());
                ids = new Array();
                $('input[name|="'+inputId+'_default"]').each(function (index, domElement){
                    if ($(domElement).val() != that.val()) {
                        ids.push($(domElement).val());
                    }
                });
                $('#'+inputId+'_extra').val(ids.join());
            }
        });

        $(document).on('click', 'a.selected-remove', function(e){
            e.preventDefault();

            var inputId = $(this).attr('data-input');
            var checked = $(this).prev().prop('checked');

            $(this).parent().remove();
            var ids = [];
            var inputs = $('input[name|="'+inputId+'_default"]');

            if (inputs.length == 0) {
                $('#'+inputId).val(0);
                $('#'+inputId+'_title').html('Не выбрано');
                $('#'+inputId+'_extra').val('');
            } else {
                var firstElement = inputs.first();
                if (checked != undefined && checked && firstElement != undefined) {
                    firstElement.prop('checked', true);
                    $('#'+inputId).val(firstElement.val());
                }
                inputs.each(function (index, domElement){
                    if ($(domElement).val() != $('#'+inputId).val()) {
                        ids.push($(domElement).val());
                    }
                });
                $('#'+inputId+'_extra').val(ids.join());
            }

        });

        $('#crew-vacancy').submit(function(){
            //e.preventDefault();

            var that = $(this);
            var path = that.attr('action');
            var message = $('#message-vacancy');

            message.hide();

            $.post(path, that.serialize(), function(data){
                if (data.error) {
                    message
                        .removeClass()
                        .addClass('alert alert-error')
                        .html(data.message)
                        .fadeIn(500);
                } else {
                    message
                        .removeClass()
                        .addClass('alert alert-success')
                        .html(data.message)
                        .fadeIn(500);
                }

            }, "json");

            return;
        });

        $('.btn-game-create-simple').click(function(e) {
            e.preventDefault();

            var that = $(this);
            var type = that.siblings('input[name=type]').val();
            var date = that.siblings('div').find('input[name=date]').val();
            var time = that.siblings('div').find('input[name=date_time]').val();

            var path = that.parent().attr('action');

            var message = that.siblings('.alert');

            console.log(type, date, time, path);

            message.hide();

            $.post(path, {type: type, date: date, time: time}, function(data){
                console.log(data);
                if (data.error) {
                    message
                        .removeClass()
                        .addClass('alert alert-error')
                        .html(data.message)
                        .fadeIn(500);
                } else {
                    message
                        .removeClass()
                        .addClass('alert alert-success')
                        .html(data.message)
                        .fadeIn(500);
                }

            }, "json");
        });

        $('.btn-game-create-labirint').click(function(e) {
            e.preventDefault();

            var that = $(this);
            var date = that.siblings('div').find('input[name=date]').val();
            var time = that.siblings('div').find('input[name=date_time]').val();

            var path = that.parent().attr('action');

            var message = that.siblings('.alert');

            console.log(date, time, path);

            message.hide();

            $.post(path, {date: date, time: time}, function(data){
                console.log(data);
                if (data.error) {
                    message
                        .removeClass()
                        .addClass('alert alert-error')
                        .html(data.message)
                        .fadeIn(500);
                } else {
                    message
                        .removeClass()
                        .addClass('alert alert-success')
                        .html(data.message)
                        .fadeIn(500);
                }

            }, "json");
        });

        var $dateFields = $('.field-date');
        if ($dateFields.length > 0) {
            // $.cachedScript( prj_ref + '/bundles/calendar/calendar.js' ).done(function( script, textStatus ) {
            //     //console.log('calendar.js');
            // });
            // $.cachedScript( prj_ref + '/bundles/calendar/calendar-ru.js' ).done(function( script, textStatus ) {
            //     //console.log('calendar-ru.js');
            // });;
            // $.cachedScript( prj_ref + '/bundles/calendar/calendar-setup.js' ).done(function( script, textStatus ) {
            //     //console.log('calendar-setup.js');
            //     dateFields.each(function() {
            //         var name = $(this).attr('data-name');
            //         var time = $(this).attr('data-time');
            //         time = (time ? ' ' + time : '');
            //         Calendar.setup({
            //             inputField : name,
            //             ifFormat : "%d.%m.%Y" + time,
            //             showsTime : time ? true : false,
            //             button : "trigger_" + name,
            //             align : "Br",
            //             singleClick : true,
            //             timeFormat : 24,
            //             firstDay : 1
            //         });
            //     });
            // });
            $.cachedScript( prj_ref + '/bundles/pickadate/picker.js' ).done(function( script, textStatus ) {

            });

            $.cachedScript( prj_ref + '/bundles/pickadate/picker.date.js' ).done(function( script, textStatus ) {
                $dateFields.pickadate({
                    monthsFull: [ 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря' ],
                    monthsShort: [ 'янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек' ],
                    weekdaysFull: [ 'воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота' ],
                    weekdaysShort: [ 'вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб' ],
                    today: 'сегодня',
                    clear: 'удалить',
                    close: 'закрыть',
                    format: 'd mmmm, yyyy г.',
                    formatSubmit: 'yyyy-mm-dd',
                    hiddenName: true,
                    firstDay: 1,
                    selectYears: true,
                    selectMonths: true,
                    onClose: function() {
                        $('.field-date').blur();
                    }
                })
            });

            var $timeFields = $('.field-time');
            if ($timeFields.length > 0) {
                $.cachedScript( prj_ref + '/bundles/pickadate/picker.time.js' ).done(function( script, textStatus ) {
                    $timeFields.pickatime({
                        clear: 'удалить',
                        format: 'H:i',
                        formatSubmit: 'HH:i',
                        interval: 10,
                        onClose: function() {
                        $('.field-time').blur();
                    }
                    })
                });
            }


        }

        var editors = $('.tinymce');
        if (editors.length > 0) {
            $.cachedScript( prj_ref + '/bundles/tinymce/tinymce.min.js' ).done(function( script, textStatus ) {
                $.cachedScript( prj_ref + '/bundles/tinymce/tinymce.init.js' ).done(function( script, textStatus ) {})
            });

        }
    });

})(jQuery);

