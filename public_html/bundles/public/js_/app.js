function  strip_tags(str, allowed_tags) {
    var key = '', allowed = false;
    var matches = [];
    var allowed_array = [];
    var allowed_tag = '';
    var i = 0;
    var k = '';
    var html = '';

    var replacer = function(search, replace, str) {
        return str.split(search).join(replace);
    };

    // Build allowes tags associative array
    if (allowed_tags) {
        allowed_array = allowed_tags.match(/([a-zA-Z]+)/gi);
    }

    str += '';

    // Match tags
    matches = str.match(/(<\/?[\S][^>]*>)/gi);

    // Go through all HTML tags
    for (key in matches) {
        if (isNaN(key)) {
            // IE7 Hack
            continue;
        }

        // Save HTML tag
        html = matches[key].toString();

        // Is tag not in allowed list? Remove from str!
        allowed = false;

        // Go through all allowed tags
        for (k in allowed_array) {
            // Init
            allowed_tag = allowed_array[k];
            i = -1;

            if (i != 0) { i = html.toLowerCase().indexOf('<'+allowed_tag+'>');}
            if (i != 0) { i = html.toLowerCase().indexOf('<'+allowed_tag+' ');}
            if (i != 0) { i = html.toLowerCase().indexOf('</'+allowed_tag)   ;}

            // Determine
            if (i == 0) {
                allowed = true;
                break;
            }
        }

        if (!allowed) {
            str = replacer(html, "", str); // Custom replace. No regexing
        }
    }

    return str;
}



(function($) {
    $(function() {
        $(document).on('click', '.no-access a', function(e){
            e.preventDefault();
        });

        $(document).on('click', '.modal .close', function(e){
            e.preventDefault();
            clearTimeout(modalWindowTimeout);
            $(this).parents('.modal').fadeOut(500);
        });

        $(document).on('click', 'a[data-toggle=modal]', function(e){
            e.preventDefault();
            var $this = $(this);
            var target = $this.attr('data-target');
            $.get($this.attr('href'), {},
                function(data){
                    $('#modal-content').html(data.content);
                    $(target).fadeIn(500);
                }, "json");

        });

        $(document).on('click', 'input[type=radio]+label', function(e){
            var that = $(this);

            that.prev().prop('checked', !that.prev().prop('checked'));

            if (that.prev().prop('checked')) {
                that.prev()
                    .parents('ul').find('input[type=radio]')
                    .removeClass('active')
                that.prev()
                    .addClass('active')
            } else {
                that.prev()
                    .parents('ul').find('input[type=radio]')
                    .removeClass('active');
            }
            if (that.prev().attr('data-avatar') == "true") {
                $('.field-file').show();
            } else {
                $('.field-file').hide();
            }
        });

        $(document).on('change', '.field-file :file', function(e) {
            var pathname = $(this).val();
            var pos = pathname.lastIndexOf('/') > 0 ? pathname.lastIndexOf('/') : pathname.lastIndexOf('\\');
            pathname = pathname.substring(pos+1);
            $(this).siblings('div').html(pathname);
        });

        if (jQuery().jcarousel){
            $('.jcarousel').jcarousel({
                wrap: 'both'
            })
//            $('.slider-wrapper>.jcarousel').jcarouselAutoscroll({
//                interval: 5000
//            });

            $('.jcarousel-control-prev')
                .on('jcarouselcontrol:active', function() {
                    $(this).removeClass('inactive');
                })
                .on('jcarouselcontrol:inactive', function() {
                    $(this).addClass('inactive');
                })
                .jcarouselControl({
                    target: '-=1'
                });

            $('.jcarousel-control-next')
                .on('jcarouselcontrol:active', function() {
                    $(this).removeClass('inactive');
                })
                .on('jcarouselcontrol:inactive', function() {
                    $(this).addClass('inactive');
                })
                .jcarouselControl({
                    target: '+=1'
                });
        }

//        if (jQuery().mCustomScrollbar){
//            $(".skull-scroll").mCustomScrollbar({
//                axis:"x",
//                theme:"rounded-dots",
//                autoExpandScrollbar:true,
//                advanced:{autoExpandHorizontalScroll:true}
//            });
//        }

        var testQuestionNum = 1;
        var modalWindowTimeout = null;
        var startLike = false;

        $(document).on('submit', '#form-register', function(e) {
            e.preventDefault();
            $.ajax(this.action, {
                data: $("input:not(:file)", this).serializeArray(),
                files: $(":file", this),
                iframe: true,
                processData: false,
                dataType: "json"
            }).complete(function(data) {
                    data = $.parseJSON(data);
                    console.log(data);
                    if (!data.responseJSON.error) {
                        window.location.reload();
                    } else {
                        alert(data.responseJSON.error);
                    }
                });
        });

        $(document).on('click', '#cabin-btn-forget', function(e) {
            e.preventDefault();
            var login = $('#forget-login').val();
            if (!login) {
                return;
            }
            $.post('/ajax/user/forget', {login: login},
                function(data) {
                    if (!data.error) {
                        $('#modal-content').html(data.content);
                        $('#myModal').show();
                        setTimeout(function(){
                            $('#myModal').hide();
                        }, 10000);
                    } else {
                        alert(data.error);
                    }
                }, "json");
        });

        $(document).on('click', '#cabin-btn-password', function(e) {
            e.preventDefault();
            var password = $('#password').val();
            var password_old = $('#password-old').val();
            var password_again = $('#password-again').val();

            if (!password || !password_old || !password_again) {
                return;
            }

            $.post('/ajax/user/passchange', {password: password, password_old: password_old, password_again: password_again},
                function(data) {
                    if (!data.error) {
                        $('#modal-content').html(data.content);
                        $('#myModal').show();
                        setTimeout(function(){
                            $('#myModal').hide();
                        }, 5000);
                    } else {
                        alert(data.error);
                    }
                }, "json");
        });

        $(document).on('click', '.start-test', function(e){
            if (testQuestionNum > 10) {

                $('.start-test-result').trigger('click');
                return;
            }
            $.post('/ajax/user/test', {question: testQuestionNum},
                function(data){
                    $('#modal-content').html(data.content);
                    $('#myModal').show();
                    testQuestionNum++;
                }, "json");
        });
        $(document).on('click', '#cabin-btn-test', function(e){
            $('.start-test').trigger('click');
        });

        $(document).on('click', '#cabin-btn-continue', function (e){
            $('.stop-test').trigger('click');
            $('.start-ship').trigger('click');
        });

        $(document).on('click', '#cabin-btn-ship', function (e){

            var name = $('#ship-name').val();
            var flag = $('input[type=radio]:checked').val();

            if (name == '') {
                alert('Выберите название корабля');
                return;
            }

            if (flag == undefined) {
                alert('Выберите флаг корабля');
                return;
            }

            $.post('/ajax/user/ship', {name: name, flag: flag},
                function(data){
                    if (data.error) {
                        alert(data.error);
                    } else {
                        $('.content').html(data.content);
                        $('#myModal').hide();
                    }
                }, "json");
        });

        $(document).on('click', '.start-test-result', function(e){
            $.post('/ajax/user/prof', {},
                function(data){
                    $('#modal-content').html(data.content);
                    $('#myModal').show();
                }, "json");
        });

        $(document).on('click', '.stop-test', function(e){
            $('#myModal').hide();
        });

        // start ship setting for first helper
        $(document).on('click', '.start-ship', function(e){
            $.get('/ajax/user/ship', {},
                function(data){
                    $('#modal-content').html(data.content);
                    $('#myModal').show();
                }, "json");
        });

        $(document).on('click', '.message-login', function(e){
            alert($(this).html());
        });

        $(document).on('click', '#cabin-btn-avatar', function(){
            $.get('/ajax/user/avatar', {},
                function(data){
                    $('#modal-content').html(data.content);
                    $('#myModal').show();
                }, "json");
        });

        $(document).on('submit', '#form-avatar', function(e){
            e.preventDefault();
            $.ajax(this.action, {
                data: {},
                files: $(":file", this),
                iframe: true,
                processData: false,
                dataType: "json"
            }).complete(function(data) {
                    if (data.responseJSON.error) {
                        alert(data.responseJSON.error);
                       return;
                    }

                    $('#cabin-avatar').attr('src', data.responseJSON.avatar);
                    $('#myModal').hide();
                });
        });

        $(document).on('click', '.edit', function(e){
            var that  = this;
            var $this = $(this);
            $this.siblings('span').each(function(){
                var $input = $('<input>').addClass('editor').val($(this).text());
                $(this).attr('data-old', $(this).text()).html($input.get(0));
            });

            var $button = $('<button></button>')
                .addClass('btn-save')
                .html('Сохранить');
            $this.parent().append($button.get(0).outerHTML);
            $this.hide();
        });

        $(document).on('click', '.user-info .btn-save', function(e) {
            var values = {};
            var $btn = $(this);
            $btn.siblings('span').each(function(){
                values[$(this).attr('data-field')] = $(this).find('input').val();
            });
            $.post('/ajax/user/change', values,
                function(data){
                    if (data.error) {
                        $btn.siblings('span').each(function(){
                            $(this).html($(this).attr('data-old')).removeAttr('data-old');
                        });
                    } else {
                        $btn.siblings('span').each(function(){
                            $(this).html(strip_tags($(this).find('input').val()));
                        });
                    }

                    $btn.siblings('img').show();
                    $btn.remove();
                }, "json");
        });

        $(document).on('click', '.content-ship .btn-save', function(e) {
            var values = {};
            var $btn = $(this);
            $btn.siblings('span').each(function(){
                values[$(this).attr('data-field')] = $(this).find('input').val();
                $(this).removeClass('edited').removeAttr('contenteditable');
            });
            $.post('/ajax/ship/change', values,
                function(data){
                    if (data.error) {
                        $btn.siblings('span').each(function(){
                            $(this).html($(this).attr('data-old')).removeAttr('data-old');
                        });
                    } else {
                        $btn.siblings('span').each(function(){
                            $(this).html(strip_tags($(this).find('input').val()));
                        });
                    }

                    $btn.siblings('img').show();
                    $btn.remove();
                }, "json");
        });

        $(document).on('click', '.pirate, .ship', function(){
            var $this = $(this);
            var url = $(this).attr('data-url');
            var id = $(this).attr('data-id');
            $.post(url, {id: id},
                function(data){
                    if (!data.error) {
                        $this.find('.like').toggleClass('active');
                    }
                }, "json");
        });

        $(document).on('click', '.vacancy-answer:not(.inactive)', function(e){
            var $this = $(this);
            $this.addClass('inactive');
            var ship = $(this).attr('data-ship');
            var vacancy = $(this).attr('data-vacancy');
            $.post('/ajax/crew/reply', {ship: ship, vacancy: vacancy},
                function(data){
                    if (!data.error) {
                        $('#modal-content').html(data.content);
                        $('#myModal').show();
                        setTimeout(function(){
                            $('#myModal').hide();
                        }, 10000);
                    } else {
                        $this.removeClass('inactive');
                        alert(data.error);
                    }

                }, "json");
        });

        $(document).on('click', '.ship-btn-hire', function(e){
            e.preventDefault();
            var $this = $(this);
            var id = $(this).attr('data-id');
            $.post('/ajax/ship/hire', {id: id},
                function(data){
                    if (!data.error) {
                        if (data.quantity > 0 && $this.parents('.candidates').find('.pirate').length > 0) {
                            $this.parents('.pirate').fadeOut(800).remove();
                        } else {
                            $this.parents('.vacancy').fadeOut(800).remove();
                        }
                        if ($('.hire-pirates .pirate').length == 0) {
                            $('#myModal').show(0).delay(1000).hide(0);
                            $('#ship-btn-show').hide();
                        }

                        // todo обновить экипаж корабля

                    } else {
                        alert(data.error);
                    }
                }, "json");
        });

        var captainOldRoleId = 0;
        var captainOldRoleName = null;
        var captainId = 0;
        var marineId = 0;


        $(document).on('click', '.ship-btn-captain', function(e){
            e.preventDefault();
            var $this = $(this);
            if (captainId > 0) {
                marineId = $this.attr('data-id');
            } else {
                captainOldRoleId = $this.attr('data-role');
                captainOldRoleName = $this.attr('data-role-name');
                captainId = $this.attr('data-id');
                if (captainOldRoleId != 2) {
                    $('.candidates .pirate').removeClass('selected');
                    $this.parents('.pirate').addClass('selected');
                    $('.marine-title').append('&laquo;'+captainOldRoleName+'&raquo;');
                    $('.marines').show();
                    return;
                }
            }

            $.post('/ajax/ship/captain', {id: captainId, marine: marineId},
                function(data){
                    if (!data.error) {
                        $('#ship-btn-captain-form').hide();
                        $('#ship-captain').html(data.captain.name+' '+data.captain.lastname);
                        $('#modal-content').html(data.content);
                        $('#myModal').show(0).delay(5000).hide(0);
                    } else {
                        alert(data.error);
                    }
                }, "json");
        })

        $(document).on('click', '#ship-btn-money', function(e){
            e.preventDefault();
            var $this = $(this);
            var shipPurse = parseInt($('#ship-purse').val());
            var money = 0;
            var inputs = {};
            var isNegative = false;
            $("input.user-purse").each(function(){
                if (money < 0) {
                    alert('Отрицательные значения не допустимы');
                    isNegative = true;
                    return false;
                }
                money = money + parseInt($(this).val());
                inputs[$(this).attr('name')] = $(this).val();
            });

            if (isNegative) {
                return;
            }

            if (money < shipPurse) {
                alert('Распределены не все деньги. Осталось ' + (shipPurse-money) + ' пиастров');
                return;
            }

            if (money > shipPurse) {
                alert('Распределено денег больше, чем есть на корабле');
                return;
            }

            $.post('/ajax/ship/money', inputs,
                function(data){
                    if (!data.error) {
                        $('#ship-btn-divide').hide();
                        $('#ship-common-purse').html(0);
                        $('#modal-content').html(data.content);
                        $('#myModal').show(0).delay(5000).hide(0);
                    } else {
                        alert(data.error);
                    }
                }, "json");
        });

        $('.message-login').trigger('click');


        $.get('/ajax/user/current?_=' + new Date().getTime(), {},
            function(data){
                if (data.user) {
                    $('.no-access').each(function(){
                        if ($(this).hasClass('tavern') || $(this).hasClass('news')) {
                            if (data.user) {
                                $(this).removeClass('no-access');
                                return;
                            }
                        }

                        if ($(this).hasClass('ship') && data.user.ship_id > 0) {
                            $(this).removeClass('no-access');
                            return;
                        }

                        if (($(this).hasClass('cabin') || $(this).hasClass('dice')) && (data.user.group_id == 1 || data.user.group_id == 2)) {
                            $(this).removeClass('no-access');
                            return;
                        }
                    });

                    if (data.user.is_tested == 0 && data.user.role_id == 1) {
                        $('.start-test-result').trigger('click');
                    } else if (data.user.is_tested == 0 && data.user.role_id > 1) {
                        $('.start-test').trigger('click');
                    } else if (data.user.role_id == 1 && data.user.ship.flag == 0) {
                        $('.start-ship').trigger('click');
                    }
                }
            }, "json");

        $.get('/ajax/news/fresh?_=' + new Date().getTime(), {},
            function(data){
                if (data.fresh) {
                    $('i.news').show();
                }
            }, "json");

    });

})(jQuery);

var closeUserInfo = null;