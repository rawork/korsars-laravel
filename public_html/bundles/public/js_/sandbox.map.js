(function($){
    (function(init){
        init();
    }(function(){

        /*
         ----------------------------------------
         PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S)
         ----------------------------------------
         */

        var pluginNS="mapGame",
            pluginPfx="mapGame",
            defaultSelector=".game-map",
            mapData = {},
            choosedCell = null,
            timerSeconds = 10,
            answerInterval = null,
            timerReal = 0;

        /*
         ----------------------------------------
         DEFAULT OPTIONS
         ----------------------------------------
         */

            defaults={

                userInfoUrl: '/ajax/sandbox/map/data',
                mapDataUrl: '/data/map/map.json',
                setCellUrl: '/ajax/sandbox/map/data',

                messageInit: '<h2>Игра загружается, подождите...</h2>',
                messageBefore: '<h2>Время начала игры<br>#time#</h2><br><button class="btn" id="btn-reload">Обновить страницу</button>',
                messageAfter: '<h2 class="end-message">Игра завершена.<br>Результаты будут объявлены позже.</h2>'
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

                            _loadData.call(this);
                            _setEvents.call(this);

                            methods.start.call(this);

                        }

                    });

                },
                /* ---------------------------------------- */

                start: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;
                    $.get(o.userInfoUrl, {},
                        function(data){
                            if (data.error) {
                                $this.html('<h2 class="init-message">'+data.error+'</h2>');
                                return;
                            }
                            data.game.stop = parseInt(data.game.start) + (data.game.duration*60*60*24);
                            currentTime = data.game.current;
                            if (data.game.start > currentTime) {
                                _beforeMessage.call(that, data.game.start);
                            } else if (data.game.stop < currentTime) {
                                _afterMessage.call(that);
                            } else {
                                _pluginMarkup.call(that); /* add plugin markup */

                                if (data.game.cell != '') {
                                    $('#map-btn-ready').hide();
                                    $('#'+data.game.cell).addClass('active');
                                } else {
                                    if (data.game.is_ready == 1 || data.game.is_hunter == 0) {
                                        if (data.game.is_hunter != 0){
                                            $('#map-matrix').addClass('ready');
                                        }
                                        $('#map-btn-ready').hide();
                                    }
                                }
                            }
                        }, "json");
                },
                /* ---------------------------------------- */

                timer: function() {
                    $('#map-timer').html(timerReal--);
                    if (timerReal <= 0) {
                        clearInterval(answerInterval);
                        $('#map-btn-yes').trigger('click');
                    }
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

        /* before message */
            _beforeMessage=function(start){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;
                var dt = new Date(start*1000);
                var msg = o.messageBefore;
                msg = msg.replace('#time#', dt.getFullYear() + '.' + (dt.getMonth()<10?'0':'') + dt.getMonth() + '.' + (dt.getDate()<10?'0':'') + dt.getDate() + ' ' + (dt.getHours()<10?'0':'') + dt.getHours() + ':' + (dt.getMinutes()<10?'0':'') + dt.getMinutes());
                $this.html(msg);
            };
        /* -------------------- */

        /* after message */
            _afterMessage=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $this.html(o.messageAfter);
            };
        /* -------------------- */


        /* generates plugin markup */
            _pluginMarkup=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $this.html(o.messageInit);

                $this.html('<div class="map"><div class="relative"><div class="matrix"><ul id="map-matrix"></ul></div></div></div><div class="info"><div class="map-hint" id="map-hint"><div id="map-hint-title" class="title"></div><div id="map-hint-text" class="text"></div></div><button id="map-btn-task">Посмотреть задание</button><button id="map-btn-ready">Готов указать<br>место нападения</button></div>');
                var lowEnd = 1;
                var highEnd = 210;
                while (lowEnd <= highEnd) {
                    var li = $('<li></li>').attr('id', 'cell' + lowEnd++);
                    $('#map-matrix').append(li[0].outerHTML);
                }
            };
        /* -------------------- */

        /* set events for buttons */
            _setEvents=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $(document).on('click', '#btn-reload', function(){
                    window.location.reload();
                });

                $(document).on('click', '#map-btn-task', function(e){
                    $('#modal-content').html('<div id="modal-content-fixed"></div>');
                    $('#modal-content-fixed')
                        .append('<h4>'+mapData.task.title+'</h4>'+ mapData.task.text)
                        .append('<h4>'+mapData.matrix.cell31.title+' (характеристики)</h4>'+ mapData.matrix.cell31.text)
                        .append('<h4>'+mapData.route.title+'</h4>'+ mapData.route.text)
                        .append('<h4>'+mapData.aqua.title+'</h4>'+ mapData.aqua.text)
                        .append('<h4>'+mapData.matrix.cell151.title+' (характеристики)</h4>'+ mapData.matrix.cell151.text);
                    $('#myModal').show();
                });

                $(document).on('click', '#map-btn-ready', function(e){
                    $.post(o.setCellUrl, {is_ready: 1},
                        function(data){
                            $('#map-matrix').addClass('ready');
                        }, "json");
                    $(this).hide();
                });

                $(document).on('mouseenter', 'ul#map-matrix li', function(){
                    var id = $(this).attr('id');
                    var cell = mapData.matrix != undefined ? mapData.matrix[id]  : null;
                    if (cell != null) {
                        $('#map-hint-title').html(cell.title);
                        $('#map-hint-text').html(cell.text);
                    }

                });
                $(document).on('mouseleave', 'ul#map-matrix li', function(){
                    $('#map-hint-title').empty();
                    $('#map-hint-text').empty();
                });

                $(document).on('click', 'ul#map-matrix.ready li', function(){

                    $('#modal-content').html('<h2>Вы уверены, что выбрали самое<br>удобное место для нападения?</h2><div id="map-timer" class="map-timer"></div><button id="map-btn-no">Нет</button><button id="map-btn-yes">Да</button>');
                    timerReal = timerSeconds;
                    $('#map-timer').html(timerReal);
                    answerInterval = setInterval(function(){
                        $('#map-timer').html(--timerReal);
                        if (timerReal <= 0) {
                            clearInterval(answerInterval);
                            $('#map-btn-yes').trigger('click');
                        }
                    }, 1000);
                    choosedCell = $(this).attr('id');
                    $('#'+choosedCell).addClass('active');
                    $('#myModal').show();

                });

                $(document).on('click', '#map-btn-no', function(){
                    clearInterval(answerInterval);
                    $('#'+choosedCell).removeClass('active');
                    $('#myModal').hide();
                });

                $(document).on('click', '#map-btn-yes', function(){
                    $.post(o.setCellUrl, {cell: choosedCell},
                        function(data){
                            $('#modal-content').html('<h1>ваш ответ принят!</h1>');
                            $('#myModal').show().delay(3000).hide(0, function(){
                                $('#map-matrix').removeClass('ready');
                            });
                        }, "json");
                });
            }
        /* -------------------- */

        /* load map data from backend */
            _loadData=function() {
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;
                $.get(o.mapDataUrl, {},
                    function(data){
                        mapData = data;
                    }, "json");
            }
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

            $(defaultSelector)[pluginNS](); /* add scrollbars automatically on default selector */

        });

    }))})(jQuery);

