<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>КОРСАРЫ АНКОРа - @yield('title')</title>

    <link href="{{ asset('/bundles/public/css/app.inner.css') }}" rel="stylesheet" media="screen">
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
            <i class="logo"><a href="/"><img src="/bundles/public/img/logo.png"></a></i>
            <i class="title">@yield('h1')</i>
            @if (url()->current() == 'cabin')
            <i class="link ship">
                <img src="/bundles/public/img/ship.png"><br>
                <a href="/ship">МОЙ КОРАБЛЬ</a><br>
                <span>Кают-компания</span>
            </i>
            @else
            <i class="link cabin no-access">
                <img src="/bundles/public/img/cabin.png"><br>
                <a href="/cabin">МОЯ КАЮТА</a><br>
                <span>Добро пожаловать на борт</span>
            </i>
            @endif
            @if (url()->current() == 'tavern')
            <i class="link dice no-access">
                <img src="/bundles/public/img/dice.png"><br>
                <a href="/sandbox/dice">КОСТИ</a><br>
                <span>Испытай свою удачу!</span>
            </i>
            @else
            <i class="link tavern no-access">
                <img src="/bundles/public/img/tavern.png"><br>
                <a href="/tavern">ТАВЕРНА</a><br>
                <span>У нас свежие сплетни!</span>
            </i>
            <i class="news no-access">
                <div class="news-btn">new</div>
            </i>
            @endif
            <i class="link mainpage">
                <img class="pull-left" src="/bundles/public/img/mainpage_arrow.png">
                <a href="/">НА ГЛАВНУЮ</a>
            </i>
        </div>
    </div>
    <div class="content content-@yield('pagename') clearfix">
        @yield('content')
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
<script src="/bundles/scrollbar/jquery.mCustomScrollbar.js"></script>
<script src="/bundles/jcarousel/jquery.jcarousel.min.js"></script>
<script src="/bundles/jquery/jquery.iframe-transport.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.min.js"></script>
<script src="{{ asset('/bundles/public/js/app.js') }}"></script>
@yield('js')
</body>
</html>