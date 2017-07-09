(function($){
    (function(init){
        init();
    }(function(){

        /*
         ----------------------------------------
         PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S)
         ----------------------------------------
         */

        var pluginNS="pexesoGame",
            pluginPfx="pexesoGame",
            defaultSelector=".game-pexeso",
            pexesoData = {},
            pexesoStorage = null,
            openedCells = [],
            currentTime = 0,
            foundNeeded = 0,
            moneyPrize = 10,
            stepInterval = null;

        /*
         ----------------------------------------
         DEFAULT OPTIONS
         ----------------------------------------
         */

            defaults={

                userInfoUrl: '/ajax/sandbox/pexeso/data',
                loadDataUrl: '/data/pexeso/pexeso.json',
                resultUpdateUrl: '/ajax/sandbox/pexeso/data',

                messageInit: '<h2 class="init-message">Игра загружается, подождите...</h2>',
                messageBefore: '<h2>Время начала игры<br>#time#</h2><br><button class="btn" id="btn-reload">Обновить страницу</button>',
                messageAfter: '<h2 class="end-message">Игра завершена.<br>Результаты будут объявлены позже.</h2>',
                messageStart: '<button id="pexeso-btn-start">Начать игру</button>'
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

                            ns=$.initNamespaceStorage(pluginNS);
                            pexesoStorage = ns.localStorage // Namespace in localStorage

                            _initMessage.call(this);
                            _loadData.call(this);
                            _setEvents.call(this);

                            $.get(o.userInfoUrl, {},
                                function(data){
                                    if (data.error) {
                                        $this.html('<h2 class="init-message">'+data.error+'</h2>');
                                        return;
                                    }
                                    currentTime = data.game.current;

                                    data.game.stop = parseInt(data.game.start) + (data.game.duration*60);


                                    pexesoStorage.set('start', data.game.start);
                                    pexesoStorage.set('duration', data.game.duration);
                                    pexesoStorage.set('stop', data.game.stop);

                                    pexesoStorage.set('user', data.game.user_id);
                                    pexesoStorage.set('step', parseInt(data.game.step));
                                    pexesoStorage.set('money', data.game.money);
                                    if (pexesoStorage.get('user') != data.game.user_id) {
                                        pexesoStorage.remove('started');
                                    }

                                    if (pexesoStorage.get('start') > currentTime) {
                                        _beforeMessage.call(that);
                                    } else if (pexesoStorage.get('stop') < currentTime || pexesoStorage.get('step') > 5) {
                                        _afterMessage.call(that);
                                    } else {
                                        if (pexesoStorage.isEmpty('started')) {
                                            _startMessage.call(that);
                                        } else {
                                            methods.start.call(that);
                                        }
                                    }
                                }, "json");

                        }
                    });
                },
                /* ---------------------------------------- */

                start: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    var userStep = pexesoStorage.get('step');
                    var elements = pexesoData.steps['step'+userStep]['need'];
                    var customs = pexesoData.customs;
                    pexesoStorage.set('elements', elements);
                    foundNeeded = 0;

                    if (pexesoStorage.isEmpty('started')) {
                        _shuffle(customs);
                        customs = customs.slice(0,12).concat(elements);

                        var images = new Array()
                        function preload(imgs) {
                            for (i in imgs) {
                                images[i] = new Image();
                                images[i].src = '/bundles/public/img/pexeso/' + imgs[i] + '.png';
                            }
                        }
                        preload(customs);

                        var pexesoMatrix = customs.concat(customs);
                        _shuffle(pexesoMatrix);

                        pexesoStorage.set('field', pexesoMatrix);
                        pexesoStorage.set('started', pexesoData.time);
                    }

                    _pluginMarkup.call(that);

                    $('#pexeso-timer').html(pexesoStorage.get('started'));
                    stepInterval = setInterval(function(){
                        var realTimer = pexesoStorage.get('started');
                        $('#pexeso-timer').html(--realTimer);
                        pexesoStorage.set('started', realTimer);
                        if (realTimer <= 0) {
                            clearInterval(stepInterval);
                            $('.pexeso-time').trigger('click');
                        }
                    }, 1000);
                    $('#pexeso-step').html(userStep);
//                    $('#pexeso-account').html(userResult).show();
                    $('#pexeso-description').html(pexesoData.steps['step'+userStep]['text']);

                    for (var i in elements) {
                        var li = $('<li>x1</li>').addClass(elements[i]);
                        $('#pexeso-elements').append(li.get(0));
                    }

                    var j = 1;
                    while (j <= pexesoData.cells) {
                        var li = $('<li></li>').attr('id', 'cell' + j).attr('data-id', j);

                        var pexesoField = pexesoStorage.get('field');
                        if (pexesoField[j-1] == 'opened') {
                            li.addClass('opened');
                        }

                        $('#pexeso-field').append(li.get(0));
                        j++;
                    }
                    $('ul#pexeso-field').addClass('active');

                },
                /* ---------------------------------------- */

                next: function(){
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    var userStep = pexesoStorage.get('step');

                    $('#pexeso-timer').html('&nbsp;');
                    $('ul#pexeso-field').removeClass('active');
                    $('.modal-dialog').html('<h1 class="step-end-message">КОН ' + userStep + ' завершен</h1>');
                    $.post(o.resultUpdateUrl, {step: userStep+1, money: pexesoStorage.get('money')},
                        function(data){

                        }, "json");

                    $('#myModal').show(400).delay(2000).hide(0, function(){
                        pexesoStorage.remove('started');
                        pexesoStorage.remove('field');
                        if (userStep >= 5) {
                            pexesoStorage.remove('user');
                            _afterMessage.call(that);
                        } else {
                            pexesoStorage.set('step', ++userStep);
                            _startMessage.call(that);
                        }

                    });

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

        /* before message */
            _beforeMessage=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;
                var dt = new Date(pexesoStorage.get('start')*1000);
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

        /* start message */
            _startMessage=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $.get(o.loadDataUrl, {},
                    function(data){
                        pexesoData = data;
                        var task = pexesoData.steps['step'+ pexesoStorage.get('step')]['task'];

                        $this.html('<h2>кон ' + pexesoStorage.get('step') + '<br>' + task + '</h2>' + o.messageStart);
                    }, "json");

            };
        /* -------------------- */

        /* generates plugin markup */
            _pluginMarkup=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $this.html('<div class="info"><div class="timer" id="pexeso-timer"></div><div class="step">кон: <span id="pexeso-step"></span></div><div class="account">счет: <span id="pexeso-account"></span></div><div class="description" id="pexeso-description"></div><ul class="elements" id="pexeso-elements"></ul><div class="pexeso-time"></div></div><div class="field"><ul id="pexeso-field"></ul></div>');
            };
        /* -------------------- */

        /* set events for buttons */
            _setEvents=function(){
                var that = this;
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $(document).on('click', '#btn-reload', function(){
                    window.location.reload();
                });

                $(document).on('click', '#pexeso-btn-start', function(){
                    methods.start.call(that, $this);
                });

                $(document).on('click', 'ul#pexeso-field.active li:not(.opened,.opened-temp)', function(){
                    var $li = $(this);
                    $li.addClass('opened-temp');
                    var $ul = $('ul#pexeso-field');
                    $ul.removeClass('active');
                    var pexesoMatrix = pexesoStorage.get('field');
                    openedCells.push(pexesoMatrix[$li.attr('data-id')-1]);
                    if (openedCells.length >= 2) {
                        if (openedCells[0] == openedCells[1]) {
                            $li.addClass(pexesoMatrix[$li.attr('data-id')-1]).show(0).delay(1000).show(0, function(){
                                $('ul#pexeso-field li.'+openedCells[0]).each(function(){
                                    pexesoMatrix[$(this).attr('data-id')-1] = 'opened';
                                }).removeClass(openedCells[0]).addClass('opened');
                                pexesoStorage.set('field', pexesoMatrix);
                                var elements = pexesoStorage.get('elements');
                                if (elements.indexOf(openedCells[0]) != -1) {
                                    foundNeeded++;
                                } else {
                                    pexesoStorage.set('money', parseInt(pexesoStorage.get('money')) + moneyPrize);
                                }
                                openedCells = [];
                                if ($('ul#pexeso-field li:not(.opened)').length == 0) {
                                    $('.pexeso-time').trigger('click');
                                }
                                $ul.addClass('active');
                            });
                        } else {
                            $li.addClass(pexesoMatrix[$li.attr('data-id')-1]).show(0).delay(1000).show(0, function(){
                                $('ul#pexeso-field li.'+openedCells[0]).removeClass(openedCells[0]+' opened-temp');
                                $('ul#pexeso-field li.'+openedCells[1]).removeClass(openedCells[1]+' opened-temp');
                                openedCells = [];
                                $ul.addClass('active');
                            });
                        }
                    } else {
                        $li.addClass(pexesoMatrix[$li.attr('data-id')-1]);
                        $ul.addClass('active');
                    }
                });

                $(document).on('click', '.pexeso-time', function(){
                    if (foundNeeded < 3) {
                        pexesoStorage.set('money', parseInt(pexesoStorage.get('money')) - ((3-foundNeeded)*moneyPrize));
                    }
                    methods.next.call(that);
                });

            };
        /* -------------------- */

        /* load map data from backend */
            _loadData=function() {
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;
                $.get(o.loadDataUrl, {},
                    function(data){
                        pexesoData = data;
                    }, "json");
            };
        /* -------------------- */

        /* shuffle Array */
            _shuffle=function( array ) {	// Shuffle an array
                for(var j, x, i = array.length; i; j = parseInt(Math.random() * i), x = array[--i], array[i] = array[j], array[j] = x);
                return true;
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

            $(defaultSelector)[pluginNS](); /* add scrollbars automatically on default selector */

        });

    }))})(jQuery);

