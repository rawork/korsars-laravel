(function($){
    (function(init){
        init();
    }(function(){

        /*
         ----------------------------------------
         PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S)
         ----------------------------------------
         */

        var pluginNS="taskGame",
            pluginPfx="taskGame",
            defaultSelector=".game-task",
            taskStorage = null,
            taskChests = [1000, 1550, 750, 950, 800, 900],
            taskInterval = null;

        /*
         ----------------------------------------
         DEFAULT OPTIONS
         ----------------------------------------
         */

            defaults={

                userInfoUrl: '/ajax/sandbox/task/data',
                resultUpdateUrl: '/ajax/sandbox/task/data',

                messageInit: '<h2 class="init-message">Игра загружается, подождите...</h2>',
                messageBefore: '<h2 class="before-message">Время начала игры<br>#time#</h2><br><button class="btn" id="btn-reload">Обновить страницу</button>',
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
                            taskStorage = ns.localStorage // Namespace in localStorage

                            _initMessage.call(this);
                            _setEvents.call(this);

                            $.get(o.userInfoUrl+'?_='+ new Date().getTime(), {},
                                function(data){
                                    if (data.error) {
                                        $this.html('<h2 class="init-message">'+data.error+'</h2>');
                                        return;
                                    }

                                    console.log(data);

                                    data.game.stop = parseInt(data.game.start) + (data.game.duration*60);

                                    taskStorage.set('start', data.game.start);
                                    taskStorage.set('duration', data.game.duration);
                                    taskStorage.set('stop', data.game.stop);
                                    var minutes = data.game.stop-data.game.current;
                                    var timerMinutes = _integerDivision(minutes, 60);
                                    taskStorage.set('minutes', timerMinutes );
                                    taskStorage.set('seconds', minutes - timerMinutes*60);
                                    if (taskStorage.get('start') > data.game.current) {
                                        _beforeMessage.call(that);
                                    } else if (taskStorage.get('stop') < data.game.current || data.game.is_answer == 1) {
                                        _afterMessage.call(that);
                                    } else {
                                        methods.start.call(that);
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

                    $('#task-timer').html(taskStorage.get('minutes')+':'+taskStorage.get('seconds'));
                    taskInterval = setInterval(function(){
                        var timerMinutes = taskStorage.get('minutes');
                        var timerSeconds = taskStorage.get('seconds');
                        if (timerSeconds == 0) {
                            timerMinutes--;
                            timerSeconds = 59;
                        } else {
                            timerSeconds--;
                        }
                        $('#task-timer').html(timerMinutes+':'+timerSeconds);
                        taskStorage.set('minutes', timerMinutes);
                        taskStorage.set('seconds', timerSeconds);
                        if (timerMinutes <= 0 && timerSeconds <= 0) {
                            $('.task-time').trigger('click');
                        }
                    }, 1000);

                },
                /* ---------------------------------------- */

                stop: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    clearInterval(taskInterval);
                    $('#task-timer').delay(1000).hide(0, function(){
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
                var dt = new Date(taskStorage.get('start')*1000);
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

                $this.html('<div class="relative"><i id="task-timer" class="timer">25:00</i></div><div class="description">Имперский галеон везет 6 сундуков с пиастрами для выплаты жалованья гарнизонам,<br>расположенным на островах Анкорского моря. В сундуках находится разное количество пиастров:</div><div class="chests"><ul id="task-chests"></ul></div><div class="conditions">В первый гарнизон на оплату жалованья солдатам передали ровно два полных сундука, а во второй —три. В обоих случаях денег как раз хватило, так что на других сундуках замки открывать не пришлось. Причем в первом гарнизоне сумма жалованья была в два раза меньше, чем во втором. Затем имперский галеон отправился к следующему гарнизону. Из шести сундуков на нем остался только один. Сколько в нем было пиастров?</div><div class="form"><form action="/task/answer" method="post"><input type="text" id="task-answer" name="answer" placeholder="Ответ"><br><button id="task-btn-answer">Отправить</button></form></div><div class="task-time"></div>');
                for (var i in taskChests) {
                    var $li = $('<li><img src="/bundles/public/img/chest.png"><span>' + taskChests[i] + '</span> пиастров</li>');
                    $('ul#task-chests').append($li.get(0));
                }
            };
        /* -------------------- */

        /* set events for buttons */
            _setEvents=function(){
                var that = this;
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $(document).on('click', '#btn-reload', function(){
                    window.location.reload();
                });

                $(document).on('click', '#task-btn-answer', function(e){
                    e.preventDefault();
                    var answer = $('#task-answer').val();

                    if (answer == '') {
                        return;
                    }

                    $.post(o.resultUpdateUrl, {answer: answer},
                        function(data){
                            if (!data.error) {
                                methods.stop.call(that);
                            } else {
                                alert(data.error);
                            }
                        }, "json");
                });

                $(document).on('click', '.task-time', function(){
                    methods.stop.call(that);
                });

            };
        /* -------------------- */

        /* set events for buttons */
            _setTime=function(){
                var that = this;
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $(document).on('click', '#task-btn-answer', function(){
                    window.location.reload();
                });

            };
        /* -------------------- */

            _integerDivision=function (x, y){
                return (x-x%y)/y;
            };

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

