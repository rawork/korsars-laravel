(function($){
    (function(init){
        init();
    }(function(){

        /*
         ----------------------------------------
         PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S)
         ----------------------------------------
         */

        var pluginNS="labirintGame",
            pluginPfx="labirintGame",
            defaultSelector=".game-labirint",
            labirintData = {},
            labirintStorage = null,
            stepTime = 10,
            stepInterval = null,
            labirintInterval = null,
            timerInterval = null,
            markerInterval = null,
            marker = null,
            socket = io.connect('http://localhost:8080'),
            initialized = false,

        /*
         ----------------------------------------
         DEFAULT OPTIONS
         ----------------------------------------
         */

            defaults={

                userInfoUrl: '/ajax/sandbox/labirint/data',
                labirintDataUrl: '/data/labirint/labirint.json',
                resultUpdateUrl: '/ajax/sandbox/labirint/data',

                messageInit: '<h2 class="init-message">Игра загружается, подождите...</h2>',
                messageBefore: '<h2 class="before-message">Время начала игры<br><span id="before-timer">#time#</span></h2><br><button class="btn" id="btn-reload">Обновить страницу</button>',
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
                            labirintStorage = ns.localStorage // Namespace in localStorage

                            _initMessage.call(this);

                            _loadData.call(this);
                            _setEvents.call(this);

                            socket.on('automove', function (data) {
                                // if (data.ship != labirintStorage.get('ship')) {
                                //     return;
                                // }

                                if (data.marker != marker) {
                                    var pos = parseInt(data.state.positions[data.marker])+parseInt(data.num);
                                    pos  = pos <= 100 ? pos : 100;
                                    $('#result').html(data.state.colors[data.marker] + ' игрок выкинул ' + data.num +' и перешел на клетку '+pos);
                                    $('#' + data.marker).removeClass().addClass('cell'+pos);
                                }
                            });

                            socket.on('change marker', function (data) {
                                // if (data.ship != labirintStorage.get('ship')) {
                                //     return;
                                // }

                                var state = labirintStorage.get('state');
                                if (data.marker != marker) {
                                    setTimeout(function() {
                                        $('#result').html('Ход делает ' + state.colors[data.marker] + ' игрок!');
                                    }, 2000);
                                }
                            });

                            socket.on('stop game', function(){
                                _afterMessage.call(this);
                            });

                            socket.on('rival move', function(data){
                                var pos = parseInt(data.state.positions[data.marker])+parseInt(data.num);
                                pos  = pos <= 100 ? pos : 100;
                                $('#result').html(data.state.colors[data.marker] +' игрок выкинул '+data.num+' и перешел на клетку '+pos);
                                $('#' + data.marker).removeClass().addClass('cell'+pos);
                            });

                            socket.on('move', function (data) {
                                // if (data.ship != labirintStorage.get('ship')) {
                                //     return;
                                // }

                                var pos = parseInt(data.state.positions[data.marker])+parseInt(data.num);
                                pos  = pos <= 100 ? pos : 100;
                                $('#' + data.marker).removeClass().addClass('cell'+pos);

                                var state = data.state;
                                setTimeout(function() {
                                    // console.log('move', state.positions[marker], marker, parseInt(data.num), state.positions[marker] + parseInt(data.num), state.who_run);

                                    state.positions[marker] = pos;

                                    if (state.positions[marker] > 100) {
                                        state.positions[marker] = 100;
                                    }

                                    if ('step'+state.positions[marker] in labirintData.steps) {
                                        var rule = labirintData.steps['step'+state.positions[marker]];
                                        switch (rule.type) {
                                            case 'death':
                                                state.positions[marker] = 0;
                                                state.lives[marker] = parseInt(state.lives[marker]) - 1;
                                                if (state.lives[marker] == 0) {
                                                    $('#result').html('Вы проиграли! :(');
                                                    $('#'+marker).hide();
                                                } else {
                                                    $('#result').html(rule.text);
                                                }
                                                break;
                                            case 'go':
                                                state.positions[marker] = parseInt(rule.step);
                                                $('#' + marker).removeClass().addClass('cell'+rule.step);
                                                $('#result').html(rule.text);
                                                break;
                                            case 'time':
                                                state.wait[marker] = 1;
                                                $('#result').html(rule.text);
                                                break;
                                            case 'money':
                                                state.money[marker] = parseInt(state.money[marker]) + parseInt(rule.money)
                                                $('#result').html(rule.text);
                                                break;
                                            case 'chest':
                                                state.chest[marker] = parseInt(state.chest[marker]) + 1
                                                $('#result').html(rule.text);
                                                break;
                                            case 'rom':
                                                state.rom[marker] = parseInt(state.rom[marker]) + 1
                                                $('#result').html(rule.text);
                                                break;
                                            case 'coffee':
                                                state.coffee[marker] = parseInt(state.coffee[marker]) + 1
                                                $('#result').html(rule.text);
                                                break;
                                        }
                                    }

                                    var index = parseInt(marker.replace('marker', ''));

                                    var foundNext = false;
                                    var j = 0;
                                    while (!foundNext) {
                                        if (index < 4) {
                                            index++;
                                        } else {
                                            index = 1;
                                        }

                                        if (parseInt(state.wait['marker'+index]) == 1) {
                                            state.wait['marker'+index] = 0;
                                        } else if (parseInt(state.lives['marker'+index]) > 0
                                            && parseInt(state.positions['marker'+index]) < 100 ) {
                                            foundNext = true;
                                        }

                                        j++;
                                        if (j > 5) {
                                            break;
                                        }
                                    }

                                    if (!foundNext) {
                                        _afterMessage.call(that);
                                    }

                                    state.who_run = 'marker'+index;

                                    socket.emit('update state', {ship: labirintStorage.get('ship'), state: state});
                                }, 2000);
                            });

                            socket.on('update state', function (data) {
                                // if (data.ship != labirintStorage.get('ship')) {
                                //     return;
                                // }

                                //console.log('update state', data);

                                clearInterval(stepInterval);
                                labirintStorage.set('state', data.state);
                                $.post(o.resultUpdateUrl , {state: data.state}, function(data) {
                                    // console.log(data.message)
                                }, 'json');
                                setTimeout(function() {
                                    methods.setup.call(that);
                                }, 2000);

                            });

                            socket.on('start game', function(data){
                                methods.start.call(that);
                                methods.setup.call(that);
                            });

                            $.get(o.userInfoUrl+'?_='+ new Date().getTime(), {},
                                function(data){
                                    if (data.error) {
                                        $this.html('<h2 class="init-message">'+data.error+'</h2>');
                                        return;
                                    }

                                    data.game.stop = parseInt(data.game.start) + (data.game.duration*60);

                                    labirintStorage.set('start', data.game.start);
                                    labirintStorage.set('duration', data.game.duration);
                                    labirintStorage.set('stop', data.game.stop);
                                    labirintStorage.set('user', data.game.user);
                                    labirintStorage.set('ship', data.game.ship);
                                    labirintStorage.set('room', 'ship' + data.game.ship);
                                    labirintStorage.set('state', data.game.state);

                                    socket.emit('room', labirintStorage.get('room'));
                                    socket.emit('init game', {
                                        ship: labirintStorage.get('ship'),
                                        state: labirintStorage.get('state'),
                                        starttime: labirintStorage.get('start'),
                                        stoptime: labirintStorage.get('stop')
                                    });

                                    for (i = 1; i < 5; i++) {
                                        if (data.game.state.markers['marker'+i] == data.game.user) {
                                            marker = 'marker'+i;
                                            break;
                                        }
                                    }

                                    if (!marker) {
                                        $this.html('<h2 class="init-message">Ошибка инициализации</h2>');
                                        return;
                                    }

                                    var minutes = data.game.stop-data.game.current;
                                    var timerMinutes = _integerDivision(minutes, 60);
                                    labirintStorage.set('minutes', timerMinutes );
                                    labirintStorage.set('seconds', minutes - timerMinutes*60);
                                    if (labirintStorage.get('start') > data.game.current) {
                                        _beforeMessage.call(that);
                                    } else if (labirintStorage.get('stop') < data.game.current) {
                                        _afterMessage.call(that);
                                    } else {
                                        methods.start.call(that);
                                        methods.setup.call(that);
                                    }
                                }, "json");

                        }
                    });
                },
                /* ---------------------------------------- */

                start: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    _pluginMarkup.call(that);

                    var state = labirintStorage.get('state');
                    $('.help').html('Цвет вашей фишки ' + state.colors[marker]);
                    $('#' + marker).html('ВЫ');


                    $('#timer').html(labirintStorage.get('minutes')+':'+labirintStorage.get('seconds'));
                    labirintInterval = setInterval(function(){
                        var timerMinutes = labirintStorage.get('minutes');
                        var timerSeconds = labirintStorage.get('seconds');
                        if (timerSeconds == 0) {
                            timerMinutes--;
                            timerSeconds = 59;
                        } else {
                            timerSeconds--;
                        }
                        $('#timer').html(timerMinutes+':'+timerSeconds);
                        labirintStorage.set('minutes', timerMinutes);
                        labirintStorage.set('seconds', timerSeconds);
                        if (timerMinutes <= 0 && timerSeconds <= 0) {
                            $('#labirint-time').trigger('click');
                        }
                    }, 1000);

                },
                /* ---------------------------------------- */

                setup: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    var state = labirintStorage.get('state');

                    //console.log('setup', state);

                    if (initialized) {
                        for (var i = 1; i < 5; i++) {
                            var localMarker = $('#marker' + i);
                            var posPrev = parseInt(localMarker.attr('data-position'));
                            var posCurrent = parseInt(state.positions['marker' + i]);
                            if (posPrev != posCurrent) {
                                localMarker
                                    .hide()
                                    .removeClass()
                                    .addClass('cell' + posCurrent)
                                    .attr('data-position', posCurrent)
                                    .delay()
                                    .show();
                            }
                        }
                    } else {
                        for (var i = 1; i < 5; i++) {
                            if (state.lives['marker' + i] == 0) {
                                $('#marker' + i).hide()
                            } else {
                                $('#marker' + i)
                                    .removeClass()
                                    .addClass('cell' + state.positions['marker' + i]);
                            }
                        }
                        initialized = true;
                    }

                    if (marker == state.who_run) {
                        $('#dice')
                            .removeClass()
                            .addClass('dice')
                            .show();
                        $('#result').html('Жми на кубик <span></span>');

                        if (labirintStorage.isEmpty('step_seconds')) {
                            labirintStorage.set('step_seconds', stepTime);
                        }

                        $('#result span').html(labirintStorage.get('step_seconds'));
                        stepInterval = setInterval(function(){

                            var stepSeconds = labirintStorage.get('step_seconds');
                            stepSeconds--;

                            $('#result span').html(stepSeconds);
                            labirintStorage.set('step_seconds', stepSeconds);
                            if (stepSeconds <= 0) {
                                $('#dice').trigger('click');
                            }
                        }, 1000);
                    } else {
                        $('#dice').hide();
                        $('#result').html('Ход делает ' + state.colors[state.who_run] + ' игрок!');
                    }
                },

                stop: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    clearInterval(labirintInterval);
                    $('#timer').delay(1000).hide(0, function(){
                        _afterMessage.call(that);
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
                var dt = new Date(labirintStorage.get('start')*1000);
                var msg = o.messageBefore;
                msg = msg.replace('#time#', dt.getFullYear() + '.' + (dt.getMonth()<10?'0':'') + dt.getMonth() + '.' + (dt.getDate()<10?'0':'') + dt.getDate() + ' ' + (dt.getHours()<10?'0':'') + dt.getHours() + ':' + (dt.getMinutes()<10?'0':'') + dt.getMinutes());
                $this.html(msg);
            };
        /* -------------------- */

        /* after message */
            _afterMessage=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                //socket.emit('stop game', {ship: labirintStorage.get('ship')});
                $this.html(o.messageAfter);
            };
        /* -------------------- */

        /* generates plugin markup */
            _pluginMarkup=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $this.html('<div class="relative"><div id="timer"></div><div id="ship-map"></div><div id="step7" class="step"></div><div id="step11" class="step"></div><div id="step15" class="step"></div><div id="step24" class="step"></div><div id="step27" class="step"></div><div id="step29" class="step"></div><div id="step30" class="step"></div><div id="step33" class="step"></div><div id="step36" class="step"></div><div id="step41" class="step"></div><div id="step46" class="step"></div><div id="step58" class="step"></div><div id="step61" class="step"></div><div id="step65" class="step"></div><div id="step69" class="step"></div><div id="step72" class="step"></div><div id="step75" class="step"></div><div id="step80" class="step"></div><div id="step82" class="step"></div><div id="step84" class="step"></div><div id="step87" class="step"></div><div id="step94" class="step"></div><div id="step98" class="step"></div><div id="step5" class="step death"></div><div id="step8" class="step money"></div><div id="step9" class="step time"></div><div id="step14" class="step chest"></div><div id="step19" class="step rom"></div><div id="step23" class="step coffee"></div><div id="step38" class="step chest"></div><div id="step40" class="step time"></div><div id="step42" class="step death"></div><div id="step44" class="step time"></div><div id="step45" class="step money"></div><div id="step49" class="step time"></div><div id="step51" class="step coffee"></div><div id="step54" class="step death"></div><div id="step59" class="step time"></div><div id="step63" class="step money"></div><div id="step70" class="step money"></div><div id="step74" class="step time"></div><div id="step83" class="step chest"></div><div id="step85" class="step money"></div><div id="step86" class="step time"></div><div id="step90" class="step time"></div><div id="step95" class="step chest"></div><div id="step96" class="step time"></div><div id="step97" class="step money"></div><div id="marker1" class="cell0" data-position="0"></div><div id="marker2" class="cell0" data-position="0"></div><div id="marker3" class="cell0"  data-position="0"></div><div id="marker4" class="cell0" data-position="0"></div><div class="info"><!-- <div class="message">Ход делает красный игрок!</div>--><div class="message" id="result"></div><div class="wrap"><div id="dice" class="dice"></div></div></div><div class="help"></div><div id="labirint-time"></div></div>');
            };
        /* -------------------- */

        /* set events for buttons */
            _setEvents=function(){
                var that = this;
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $(document).on('click', '#btn-reload', function(){
                    window.location.reload();
                });

                $(document).on('click', '#dice', function(){
                    labirintStorage.remove('step_seconds');
                    clearInterval(stepInterval);
                    var that = $(this);
                    $(".wrap").append("<div id='dice_mask'></div>");//add mask
                    that.attr("class","dice");//After clearing the last points animation
                    that.css('cursor','default');
                    var num = Math.floor(Math.random()*6+1);//random num 1-6

                    that.animate({left: '+2px'}, 100,function(){
                        that.addClass("dice_t");
                    }).delay(200).animate({top:'-2px'},100,function(){
                        that.removeClass("dice_t").addClass("dice_s");
                    }).delay(200).animate({opacity: 'show'},600,function(){
                        that.removeClass("dice_s").addClass("dice_e");
                    }).delay(100).animate({left:'-2px',top:'2px'},100,function(){
                        that.removeClass("dice_e").addClass("dice_"+num);
                        $("#result").html("Вы выкинули <span>"+num+"</span>");
                        that.css('cursor','pointer');
                        $("#dice_mask").remove();//remove mask
                        socket.emit('move', {ship: labirintStorage.get('ship'), state: labirintStorage.get('state'), marker: marker, num: num})
                    });
                });

                $(document).on('click', '.labirint-time', function(){
                    methods.stop.call(that);
                });

            };
        /* -------------------- */

        /* set events for buttons */
        /* -------------------- */

            _integerDivision=function (x, y){
                return (x-x%y)/y;
            };

        /* load map data from backend */
        _loadData=function() {
            var $this=$(this),d=$this.data(pluginPfx),o=d.opt;
            $.get(o.labirintDataUrl, {},
                function(data){
                    labirintData = data;
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

