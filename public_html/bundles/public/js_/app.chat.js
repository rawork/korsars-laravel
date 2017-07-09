(function($){
    (function(init){
        init();
    }(function(){

        /*
         ----------------------------------------
         PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S)
         ----------------------------------------
         */

        var pluginNS="chatApp",
            pluginPfx="chatApp",
            defaultSelector=".chat-container",
            oldestMessageId = 0,
            lastMessageId = 0,
            chatIntervalTime = 15000,
            chatIntervalId = null,
            closeChatUserInfo = null;

        /*
         ----------------------------------------
         DEFAULT OPTIONS
         ----------------------------------------
         */

            defaults={

                chatDataUrl: '/ajax/chat/common',
                chatMessageUrl: '/ajax/chat/common/message',
                chatHistoryUrl: '/ajax/chat/common/history',
                messageInit: '<div class="chat-init-message">Чат загружается, подождите...</div>'
            },

        /*
         ----------------------------------------
         VARS, CONSTANTS
         ----------------------------------------
         */

            totalInstances=0, /* plugin instances amount */
        /* general plugin classes */


        /*
         ----------------------------------------
         METHODS
         ----------------------------------------
         */

            methods={

                /*
                 plugin initialization method
                 creates the scrollbar(s), plugin data object and options
                 ----------------------------------------
                 */

                init:function(options){
                    var that = this;

                    var options=$.extend(true,{},defaults,options),
                        selector=_selector.call(this); /* validate selector */

                    /* plugin constructor */
                    return $(selector).each(function(){

                        var $this=$(this);

                        if(!$this.data(pluginPfx)){ /* prevent multiple instantiations */

                            /* store options and create objects in jquery data */
                            $this.data(pluginPfx,{
                                idx:++totalInstances, /* instance index */
                                opt:options, /* options */
                                /*
                                 object to check how scrolling events where last triggered
                                 "internal" (default - triggered by this script), "external" (triggered by other scripts, e.g. via scrollTo method)
                                 usage: object.data("mCS").trigger
                                 */
                                trigger:null
                            });

                            var d=$this.data(pluginPfx),o=d.opt;

                            _initMessage.call(this);
                            _setEvents.call(this);

                            methods.start.call(this);

                        }
                    });
                },
                /* ---------------------------------------- */

                start: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    _pluginMarkup.call(that);

                    $('#chat-messages').trigger('update');

                    chatIntervalId = setInterval(function(){
                        $('#chat-messages').trigger('update');
                    }, chatIntervalTime);

                },
                /* ---------------------------------------- */

                history: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    $.post(o.chatHistoryUrl, {id: oldestMessageId},
                        function(data){
                            if (!data.error) {
                                for (var i in data.messages) {
                                    _drawMessage.call(that, data.messages[i], 'before');
                                }
                            } else {
                                alert(data.error);
                            }
                        }, "json");

                }
                /* ---------------------------------------- */

            },


        /*
         ----------------------------------------
         FUNCTIONS
         ----------------------------------------
         */

        /* validates selector (if selector is invalid or undefined uses the default one) */
            _selector=function(){
                return (typeof $(this)!=="object" || $(this).length<1) ? defaultSelector : this;
            };
        /* -------------------- */

        /* init message */
            _initMessage=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $this.html(o.messageInit);
            };
        /* -------------------- */

        /* generates plugin markup */
            _pluginMarkup=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $this.html('<div class="chat-app"><div id="chat-messages" class="chat-text-container"></div><input type="text" id="chat-message" placeholder="Добавить сообщение"> <button id="chat-btn-send" class="btn">Отправить</button><div id="chat-user-info"><a href="#"></a><div class="role"></div><div class="ship"></div></div></div>');

            };
        /* -------------------- */

        /* generates plugin markup */
        _drawMessage=function(message, method){
            var $this=$(this),d=$this.data(pluginPfx),o=d.opt;
            message.id = parseInt(message.id);

//            console.log('message.id', message.id);
//            console.log('lastMessageId', lastMessageId);

            if (method == 'after' && message.id <= lastMessageId) {
                return;
            }

            var $a = $('<a></a>').attr('data-name', message.user_id_value.item.nickname)
                .attr('data-role', message.role.name)
                .attr('data-ship', message.ship.name)
                .html(message.user_id_value.item.nickname);
            var $span = $('<span></span>').html($a.get(0).outerHTML);
            var $div = $('<div></div>').addClass('message')
                .attr('data-id', message.id)
                .html($span.get(0).outerHTML).append(message.message);

            if (method == 'after') {
                $('#chat-messages').append($div.get(0).outerHTML);
            } else {
                $('#chat-btn-history').after($div.get(0).outerHTML);
            }

            if (message.id > lastMessageId) {
                lastMessageId = message.id;
            }

            if (message.id < oldestMessageId || oldestMessageId == 0) {
                oldestMessageId = message.id;
            }

            if ($('div#chat-messages .message').length >= 20) {
                if ($('#chat-btn-history').length == 0) {
                    $('#chat-messages').prepend('<a id="chat-btn-history" href="#">Загрузить старые сообщения</a>');
                }

            }

            if (oldestMessageId <= 1) {
                $('a#chat-btn-history').remove();
            }

            if (method == 'after') {
                var objDiv = $('div#chat-messages');
                if (objDiv.length > 0){
                    objDiv.scrollTop(objDiv.get(0).scrollHeight);
                }
            }

//            console.log('lastMessageId', lastMessageId);
        };
        /* -------------------- */

        /* set events for buttons */
            _setEvents=function(){
                var that = this;
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $(document).on('click', '#chat-btn-send', function(){
                    var message = $('#chat-message').val();

                    if (!message) {
                        return;
                    }

//                    console.log('chat send');

                    $.post(o.chatMessageUrl, {message: message},
                        function(data){
                            if (!data.error) {
                                $('#chat-messages').trigger('update');
                                $('#chat-message').val('');
                            } else {
                                alert(data.error);
                            }
                        }, "json");

                });

                $(document).on('update', '#chat-messages', function(e){
//                    console.log('update chat');
//                    console.log('lastMessageId', lastMessageId);
                    $.post(o.chatDataUrl, {id: lastMessageId},
                        function(data){
                            if (!data.error) {
                                for (var i in data.messages) {
                                    _drawMessage.call(that, data.messages[i], 'after');
                                }
                            } else {
                                alert(data.error);
                            }
                        }, "json");
                });

                $(document).on('click', '#chat-btn-history', function(e){
                    e.preventDefault();
                    methods.history.call(that);
                });

                $(document).on('click', '#chat-messages .message a', function(e){
                    e.preventDefault();
                })

                $(document).on('mouseover', '#chat-messages .message a', function(e){
                    var position = $(this).position();
                    clearTimeout(closeChatUserInfo);
                    $('div#chat-user-info a').html($(this).attr('data-name'));
                    $('div#chat-user-info div.role').html($(this).attr('data-role'));
                    $('div#chat-user-info div.ship').html($(this).attr('data-ship'));
                    $('#user-info').css({top: position.top+16+'px', left: position.left-58+'px'})
                        .fadeIn(500);
                });

                $(document).on('mouseout', '#chat-messages .message a', function(e){
                    closeUserInfo = window.setTimeout(function(){ $('#chat-user-info').fadeOut(500); closeChatUserInfo = false }, 1000);
                });

                $(document).on('mouseover', '#chat-user-info', function(e){
                    clearTimeout(closeChatUserInfo);
                });

                $(document).on('mouseout', '#chat-user-info', function(e){
                    closeChatUserInfo = window.setTimeout(function(){ $('#user-info').fadeOut(500); closeChatUserInfo = false }, 1000);
                });

            };
        /* -------------------- */

        /*
         ----------------------------------------
         PLUGIN SETUP
         ----------------------------------------
         */

        /* plugin constructor functions */
        $.fn[pluginNS]=function(method){ /* usage: $(selector).diceGame(); */
            if(methods[method]){
                return methods[method].apply(this,Array.prototype.slice.call(arguments,1));
            }else if(typeof method==="object" || !method){
                return methods.init.apply(this,arguments);
            }else{
                $.error("Method "+method+" does not exist");
            }
        };
        $[pluginNS]=function(method){ /* usage: $.diceGame(); */
            if(methods[method]){
                return methods[method].apply(this,Array.prototype.slice.call(arguments,1));
            }else if(typeof method==="object" || !method){
                return methods.init.apply(this,arguments);
            }else{
                $.error("Method "+method+" does not exist");
            }
        };

        /*
         allow setting plugin default options.
         usage: $.mCustomScrollbar.defaults.scrollInertia=500;
         to apply any changed default options on default selectors (below), use inside document ready fn
         e.g.: $(document).ready(function(){ $.mCustomScrollbar.defaults.scrollInertia=500; });
         */
        $[pluginNS].defaults=defaults;

        /*
         add window object (window.mCustomScrollbar)
         usage: if(window.mCustomScrollbar){console.log("custom scrollbar plugin loaded");}
         */
        window[pluginNS]=true;

        $(window).load(function(){

            $(defaultSelector)[pluginNS](); /* add chat automatically on default selector */

        });

    }))})(jQuery);

$('.chat-container').chatApp({
    chatDataUrl: '/ajax/chat/common',
    chatMessageUrl: '/ajax/chat/common/message',
    chatHistoryUrl: '/ajax/chat/common/history'
});

$('.detail-container').chatApp({
    chatDataUrl: '/ajax/chat/ship',
    chatMessageUrl: '/ajax/chat/ship/message',
    chatHistoryUrl: '/ajax/chat/ship/history'
});