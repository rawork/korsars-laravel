<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>@yield('title')</title>

    <link href="{{ asset('/bundles/public/css/app.css') }}" rel="stylesheet" media="screen">
    @yield('css')

    <!--[if lt IE 9]>
    <script src="/bundles/ie/html5shiv.js"></script>
    <script src="/bundles/ie/respond.min.js"></script>
    <![endif]-->
</head>
<body>
<div class="container">
    <div id="field">
        <div class="relative">
            <i class="logo"><img src="/bundles/public/img/logo.png"></i>
            <i class="title">КОРСАРЫ АНКОРа</i>
            <i class="link cabin no-access">
                <img src="/bundles/public/img/cabin.png"><br>
                <a href="/cabin">МОЯ КАЮТА</a><br>
                <span>Добро пожаловать на борт</span>
            </i>
            <i class="link tavern no-access">
                <img src="/bundles/public/img/tavern.png"><br>
                <a href="/tavern">ТАВЕРНА</a><br>
                <span>У нас свежие сплетни!</span>
            </i>
            <i class="news no-access">
                <span class="news-btn">new</span>
            </i>
            <i class="link ship no-access">
                <img src="/bundles/public/img/ship.png" class="pull-right"><br>
                <a href="/ship">МОЙ КОРАБЛЬ</a><br>
                <span>Кают-компания</span>
            </i>
            <i class="link lawbook">
                <img src="/bundles/public/img/lawbook.png" class="pull-left">
                <a href="/lawbook">КОДЕКС И ПРИЗЫ</a><br>
                <span>Правила турнира<br>и призы победителям</span>
            </i>
            <i class="link pirates">
                <img src="/bundles/public/img/pirates.png"><br>
                <a href="/pirates">УЧАСТНИКИ</a><br>
                <span>Знакомьтесь с пиратами!</span>
            </i>
            <i class="link crew">
                <img src="/bundles/public/img/crew.png"><br>
                <a href="/crew">КОМАНДЫ</a><br>
                <span>Экипажи кораблей</span>
            </i>
            <i class="content">
                {{--{{ render('Fuga:Public:Cabin:mainpage') }}--}}
                @if ($curuser->is_tested == 0)
                    <div class="start-test"></div>
                    <div class="start-test-result"></div>
                    <div class="stop-test"></div>
                @endif
                @if ($curuser->role_id == 1 and $curuser->ship->flag == 0 )
                    <div class="start-ship"></div>
                @endif
            </i>
        </div>
    </div>
    <div class="copyright">2018, Анкор</div>
</div>

<div id="myModal" class="modal">
    <div class="modal-dialog">
        <a class="close"></a>
        <div id="modal-content" class="modal-content"></div>
    </div>
</div>

<script src="/bundles/jquery/jquery.js"></script>
<script src="/bundles/jquery/jquery.iframe-transport.js"></script>
<script src="{{ asset('/bundles/public/js/app.js') }}"></script>
@yield('js')
</body>
</html>