(function($) {

    var defaults = { color:'green' };

    var methods = {
        init:function(params) {
            // актуальные настройки, будут индивидуальными при каждом запуске
            var options = $.extend({}, defaults, params);

            // инициализируем один раз
            var init = $(this).data('pexeso');

            if (init) {
                return this;
            } else {
                $(this).data('pexeso', true);
                return this.bind("click.pexeso",function(){
                    $(this).css('color', options.color);
                });
            }
        },
        color:function(color) {
            $(this).css('color', color);
        },
        reset:function() {
            $(this).css('color', 'black');
        },
        destroy:function() {
            methods.reset.apply(this);
            $(this).unbind(".pexeso");
        }
    };

    $.fn.pexeso = function(method){

        // немного магии
        if ( methods[method] ) {
            // если запрашиваемый метод существует, мы его вызываем
            // все параметры, кроме имени метода прийдут в метод
            // this так же перекочует в метод
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            // если первым параметром идет объект, либо совсем пусто
            // выполняем метод init
            return methods.init.apply( this, arguments );
        } else {
            // если ничего не получилось
            $.error( 'Метод "' +  method + '" не найден в плагине jQuery.pexeso' );
        }
    };
})(jQuery);