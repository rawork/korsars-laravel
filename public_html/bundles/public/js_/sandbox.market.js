(function($){
    (function(init){
        init();
    }(function(){

        /*
         ----------------------------------------
         PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S)
         ----------------------------------------
         */

        var pluginNS="marketGame",
            pluginPfx="marketGame",
            defaultSelector=".game-market",
            marketStorage = null,
            marketInterval = null,
            answerInterval = null,
            answerNum = 999,
            moneyPrize = 10,
            currentChest = null,
            currentTime;

        /*
         ----------------------------------------
         DEFAULT OPTIONS
         ----------------------------------------
         */

            defaults={

                userInfoUrl: '/ajax/sandbox/market/data',
                questionUrl: '/ajax/sandbox/market/question',
                moneyUpdateUrl: '/ajax/sandbox/market/data',

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

                        var that = this;
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
                            marketStorage = ns.localStorage // Namespace in localStorage

                            _initMessage.call(this);
                            _setEvents.call(this);

                            $.get(o.userInfoUrl, {},
                                function(data){
                                    if (data.error) {
                                        $this.html('<h2 class="init-message">'+data.error+'</h2>');
                                        return;
                                    }

                                    data.game.stop = parseInt(data.game.start) + (data.game.duration*60);
                                    currentTime = data.game.current;
                                    marketStorage.set('start', data.game.start);
                                    marketStorage.set('stop', data.game.stop);

                                    var minutes = data.game.stop - currentTime;
                                    var timerMinutes = _integerDivision(minutes, 60);
                                    marketStorage.set('minutes', timerMinutes );
                                    marketStorage.set('seconds', minutes - timerMinutes*60);
                                    marketStorage.set('money', data.game.money);
                                    marketStorage.set('table', data.game.question);
                                    marketStorage.set('testmode', data.game.testmode);

                                    if(marketStorage.isEmpty('questions') || marketStorage.get('testmode') == '1') {
                                        var numbers = [];
                                        var lowEnd = 1;
                                        var highEnd = 45;
                                        while (lowEnd <= highEnd) {
                                            numbers.push(lowEnd++);
                                        }
                                        _shuffle(numbers);
                                        numbers = numbers.slice(0, 25);
                                        var questions = {};
                                        for (var i in numbers) {
                                            var num = parseInt(i) + 1;
                                            questions['chest' + num] = {
                                                'question': numbers[i],
                                                'class': 'chest'
                                            }
                                        }

                                        marketStorage.set('questions', questions);
                                        marketStorage.set('money', 0);
                                    }
                                    if (marketStorage.get('start') > currentTime) {
                                        _beforeMessage.call(that);
                                    } else if (marketStorage.get('stop') < currentTime) {
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

                    $('#task-timer').html(marketStorage.get('minutes')+':'+marketStorage.get('seconds'));
                    marketInterval = setInterval(function(){
                        var timerMinutes = marketStorage.get('minutes');
                        var timerSeconds = marketStorage.get('seconds');
                        if (timerSeconds == 0) {
                            timerMinutes--;
                            timerSeconds = 59;
                        } else {
                            timerSeconds--;
                        }
                        $('#market-timer').html(timerMinutes+':'+timerSeconds);
                        marketStorage.set('minutes', timerMinutes);
                        marketStorage.set('seconds', timerSeconds);
                        if (timerMinutes <= 0 && timerSeconds <= 0) {
                            $('.market-time').trigger('click');
                        }
                    }, 1000);

                },
                /* ---------------------------------------- */

                stop: function() {
                    var that = this;
                    var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                    clearInterval(marketInterval);
                    $('#market-timer').delay(1000).hide(0, function(){
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
                var dt = new Date(marketStorage.get('start')*1000);
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

                $this.html('<div class="relative"><i id="market-timer" class="timer"></i></div><div class="account">счет: <span id="market-account"></span></div><div class="chests"><ul id="market-chests"></ul></div><div class="market-time"></div>');
                var questions = marketStorage.get('questions');
                var i = 1;
                for (var key in questions) {
                    var $li = $('<li></li>')
                        .addClass(questions[key]['class'])
                        .attr('data-num', i)
                        .attr('id', key);
                    $('ul#market-chests').append($li.get(0));
                    i++;
                }
                $('#market-account').html(marketStorage.get('money'));
            };
        /* -------------------- */

        /* set events for buttons */
            _setEvents=function(){
                var that = this;
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $(document).on('click', '#btn-reload', function(){
                    window.location.reload();
                });

                $(document).on('click', '#market-chests li:not(.skull,.money)', function(e){
                    e.preventDefault();
                    currentChest = $(this).attr('id');
                    var questions = marketStorage.get('questions');
                    var question = questions[currentChest]['question'];
                    $.post(o.questionUrl, {question: question, table: marketStorage.get('table')},
                        function(data){
                            marketStorage.set('started', 25);
                            answerNum = data.question.answer;
                            $('#myModal .close').hide();
                            $('#modal-content').html('<div id="answer-timer"></div><div class="question">'+data.question.question +'</div>')
                                .append('<div class="answers"><input name="question" value="1" type="hidden"><input type="radio" id="answer_1" name="answer" value="1" /><label for="answer_1">'+ data.question.answer1 + '</label><br><br><input type="radio" id="answer_2" name="answer" value="2" /><label for="answer_2">'+ data.question.answer2 +'</label><br><br><input type="radio" id="answer_3" name="answer" value="3" /><label for="answer_3">' + data.question.answer3 +'</label></div><button id="market-btn-answer" class="btn">Ответить</button><div class="answer-time"></div>');
                            $('#answer-timer').html(marketStorage.get('started'));
                            answerInterval = setInterval(function(){
                                var realTimer = marketStorage.get('started');
                                $('#answer-timer').html(--realTimer);
                                marketStorage.set('started', realTimer);
                                if (realTimer <= 0) {
                                clearInterval(answerInterval);
                                $('#market-btn-answer').trigger('click');
                                }
                            }, 1000);
                            $('#myModal').show();

                        }, 'json');

                });

                $(document).on('click', '#market-btn-answer', function(e) {
                    e.preventDefault();
                    clearTimeout(answerInterval);
                    var userAnswer = $('.answers input:checked').val();
                    var questions = marketStorage.get('questions');
                    if (answerNum == userAnswer) {
                        questions[currentChest]['class'] = 'money';
                        $('#'+currentChest).removeClass('chest money skull').addClass('money');
                        marketStorage.set('money', parseInt(marketStorage.get('money')) + moneyPrize);
                        $.post(o.moneyUpdateUrl, {money: marketStorage.get('money')},
                            function(data){
                                $('#market-account').html(marketStorage.get('money'));
                            }, 'json');

                    } else {
                        questions[currentChest]['class'] = 'skull';
                        $('#'+currentChest).removeClass('chest money skull').addClass('skull');
                    }
                    marketStorage.set('questions', questions);
                    currentChest = null;
                    $('#myModal .close').show();
                    $('#myModal').hide();
                    answerNum = 999;
                });

                $(document).on('click', '.market-time', function(){
                    methods.stop.call(that);
                });

            };
        /* -------------------- */

        /* integer division */
            _integerDivision=function (x, y){
                return (x-x%y)/y;
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

