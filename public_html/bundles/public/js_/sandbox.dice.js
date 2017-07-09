(function($){
    (function(init){
        init();
    }(function(){

        /*
         ----------------------------------------
         PLUGIN NAMESPACE, PREFIX, DEFAULT SELECTOR(S)
         ----------------------------------------
         */

        var pluginNS="diceGame",
            pluginPfx="diceGame",
            defaultSelector=".game-dice",
            gamerPurse = 0;


        /*
         ----------------------------------------
         DEFAULT OPTIONS
         ----------------------------------------
         */

            defaults={

                glassGamer   : '/bundles/public/img/dice/glass_gamer.svg',

                glassBankomet: '/bundles/public/img/dice/glass_bankomet.svg',

                bankometFoto : '/bundles/public/img/dice/bankomet.jpg',

                bet: 1,
                gamesCounter: 0,

                userInfoUrl: '/ajax/user/current',
                userPurseUrl: '/ajax/user/purse',

                messageInfo: '<h2>Попытать удачу на костях?</h2><div class="description">Играют 2 игрока: игрок и компьютер - банкомет. Каждый игрок бросает по 3 кости. Сумма чисел на выпавших костях будет считаться очками игроков. Первым делает ход игрок. Чтобы одержать победу, его соперник – банкомет должен бросить кости так, чтобы на них выпало большее количество очков. В этом случае игрок обязан выплатить сопернику одну ставку. Если оппоненту не удалось обыграть игрока, то он сам выплачивает ему проигранную ставку. Перед началом игры участники делают фиксированные ставки 1 пиастр.</div>',

                messageWin: '<h1>вы выиграли :)</h1>',

                messageLose: '<h1>вы проиграли :(</h1>',

                messageBankrupt: '<h2>Нам жаль,<br>удача не с вами,<br>приходите с деньгами</h2>',

                messageInit: '<h2>Игра загружается, подождите...</h2>',

                buttonTxtPlay     : 'Играть',
                buttonTxtPlayAgain: 'Играть еще',
                buttonTxtExit     : 'Выйти',
                buttonTxtMove     : 'Бросить кости',

                moneyName: 'пиастр',
                moneyEndings: ['', 'а', 'ов']

            },

        /*
         ----------------------------------------
         VARS, CONSTANTS
         ----------------------------------------
         */

            totalInstances=0, /* plugin instances amount */
            liveTimers={}, /* live option timers */
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
                                scrollRatio:{y:null,x:null}, /* scrollbar to content ratio */
                                overflowed:null, /* overflowed axis */
                                contentReset:{y:null,x:null}, /* object to check when content resets */
                                bindEvents:false, /* object to check if events are bound */
                                tweenRunning:false, /* object to check if tween is running */
                                sequential:{}, /* sequential scrolling object */
                                langDir:$this.css("direction"), /* detect/store direction (ltr or rtl) */
                                cbOffsets:null, /* object to check whether callback offsets always trigger */
                                /*
                                 object to check how scrolling events where last triggered
                                 "internal" (default - triggered by this script), "external" (triggered by other scripts, e.g. via scrollTo method)
                                 usage: object.data("mCS").trigger
                                 */
                                trigger:null
                            });

                            var d=$this.data(pluginPfx),o=d.opt;

                            _pluginMarkup.call(this); /* add plugin markup */
                            _setEvents.call(this);
                            methods.start.call(null, $this);

                        }

                    });

                },
                /* ---------------------------------------- */

                start: function(cb) {
                    var d=cb.data(pluginPfx),o=d.opt;
                    $.get(o.userInfoUrl, {},
                        function(data){
                            $('#dice-gamer-foto').attr('src', data.user.avatar);
                            gamerPurse = data.user.purse;
                            _updatePurse.call(cb.get[0], gamerPurse, o.moneyName, o.moneyEndings, o.userPurseUrl);
                            if (gamerPurse > 0) {
                                $('#dice-message').html(o.messageInfo).show();
                                $('#dice-btn-play').html(o.buttonTxtPlay).show();
                            } else {
                                $('#dice-message').html(o.messageBankrupt);
                                $('#dice-btn-play').hide();
                                $('#dice-btn-move').hide();
                                $('#dice-btn-exit').show();
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
            },
        /* -------------------- */


        /* generates plugin markup */
            _pluginMarkup=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;


                $this.html('<div class="dice-field">'+ o.messageInit+'</div>');

                $this.html('<div class="dice-bankomet"><div class="bankomet"><img id="dice-bankomet-foto" src="'+o.bankometFoto+'"><div class="title">БАНКОМЕТ</div><div class="bet">Ставка: 1 пиастр</div></div></div><div class="dice-gamer"><div class="gamer"><img id="dice-gamer-foto" src=""><div class="title">ВЫ</div><div class="bet">Ставка: 1 пиастр</div><div class="purse">Кошелек: <span id="dice-gamer-purse"></span></div></div><div id="gamer-dices" class="relative"><i id="gamer-dice1" class="dice"></i><i id="gamer-dice2" class="dice"></i><i id="gamer-dice3" class="dice"></i></div></div></div><div class="dice-field"><div id="dice-message"></div><div id="dices" class="relative"><i id="field-dice1" class="dice"></i><i id="field-dice2" class="dice"></i><i id="field-dice3" class="dice"></i></div><button id="dice-btn-exit" class="dice-button">'+o.buttonTxtExit+'</button><button id="dice-btn-play" class="dice-button">'+o.buttonTxtPlay+'</button><button id="dice-btn-move" class="dice-button">'+o.buttonTxtMove+'</button><div id="dice-glass"><img src="" id="dice-glass-svg" /></div></div>');

            };
        /* -------------------- */

        /* set events for buttons */
            _setEvents=function(){
                var $this=$(this),d=$this.data(pluginPfx),o=d.opt;

                $('#dice-btn-play').bind('click', function(e){
                    console.log('play click');
                    $('#dice-message').empty();
                    $('#dices').hide();
                    $('#gamer-dices').hide();
                    $('#dice-btn-play').hide();
                    gamerPurse -= o.bet;
                    _updatePurse(gamerPurse, o.moneyName, o.moneyEndings, o.userPurseUrl);
                    $('.bet').show();
                    $('#dice-btn-move').show();
                });

                $('#dice-btn-move').bind('click', function(e){
                    var gamerResult = 0;
                    var bankometResult = 0;
                    $(this).hide();
                    $('#dice-glass').show();
                    $('#dice-glass-svg').show().attr('src', o.glassGamer).delay(2000).hide(0, function(){
                        var num1 = Math.floor((Math.random() * 6) + 1);
                        var num2 = Math.floor((Math.random() * 6) + 1);
                        var num3 = Math.floor((Math.random() * 6) + 1);
                        gamerResult = num1+num2+num3;
                        $('#field-dice1').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num1);
                        $('#field-dice2').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num2);
                        $('#field-dice3').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num3);
                        $('#gamer-dice1').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num1);
                        $('#gamer-dice2').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num2);
                        $('#gamer-dice3').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num3);
                        $('#dices').delay(1000).show(0, function(){
                            console.log('dices');
                            $('#gamer-dices').delay(1000).show(500, function(){
                                console.log('gamer-dices');
                                $('#dices').hide();
                                $('#dice-glass-svg').show().attr('src', o.glassBankomet).delay(2000).hide(0, function(){
                                    num1 = Math.floor((Math.random() * 6) + 1);
                                    num2 = Math.floor((Math.random() * 6) + 1);
                                    num3 = Math.floor((Math.random() * 6) + 1);
                                    bankometResult = num1+num2+num3;
                                    $('#field-dice1').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num1);
                                    $('#field-dice2').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num2);
                                    $('#field-dice3').removeClass('dice1 dice2 dice3 dice4 dice5 dice6').addClass('dice'+num3);
                                    $('#dices').delay(1000).show(0, function(){
                                        $('.bet').hide();
                                        if (gamerResult >= bankometResult) {
                                            $('#dice-message').html(o.messageWin);
                                            gamerPurse += o.bet*2;
                                        } else {
                                            $('#dice-message').html(o.messageLose);

                                        }
                                        if (gamerPurse > 0) {
                                            $('#dice-btn-play').html(o.buttonTxtPlayAgain).delay(1000).show(500);
                                        } else {
                                            $('#dice-btn-exit').html(o.buttonTxtExit).delay(1000).show(500);
                                        }

                                        _updatePurse(gamerPurse, o.moneyName, o.moneyEndings, o.userPurseUrl);
                                        if (gamerPurse <= 0) {
                                            $('#dice-message').html(o.messageBankrupt);
                                            $('#dice-btn-play').hide();
                                            $('#dice-btn-move').hide();
                                            $('#dice-btn-exit').show();
                                        }

                                    });
                                });

                            });
                        });

                    });
                });

                $('#dice-btn-exit').bind('click', function(e){
                    window.location.href = '/';
                });
            }
        /* -------------------- */

        /* russian lang for money */
            _getNumEnding=function(iNumber, aEndings) {
                var sEnding, i;
                iNumber = iNumber % 100;
                if (iNumber>=11 && iNumber<=19) {
                    sEnding=aEndings[2];
                }
                else {
                    i = iNumber % 10;
                    switch (i)
                    {
                        case (1): sEnding = aEndings[0]; break;
                        case (2):
                        case (3):
                        case (4): sEnding = aEndings[1]; break;
                        default: sEnding = aEndings[2];
                    }
                }
                return sEnding;
            }
        /* -------------------- */

        /* russian lang for money */
            _updatePurse=function(purse, moneyName, endings, url) {
                $.post(url, {purse: purse},
                    function(data){
                        if (data.error) {
                            alert('Невозможно обновить данные кошелька');
                        } else {
                            $('#dice-gamer-purse').html(purse + ' '+ moneyName + _getNumEnding.call(this, purse, endings));
                        }
                    }, "json");
                $('#dice-gamer-purse').html(purse + ' '+ moneyName + _getNumEnding.call(this, purse, endings));
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

