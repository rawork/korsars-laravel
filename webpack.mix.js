const { mix } = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.setPublicPath('public_html/bundles/public');
mix.js('resources/assets/js/app.js', 'public_html/bundles/public/js')
    .copyDirectory('resources/assets/img', 'public_html/bundles/public/img')
    .sass('resources/assets/sass/app.scss', 'public_html/bundles/public/css')
    .sass('resources/assets/sass/app.inner.scss', 'public_html/bundles/public/css');
    // .options({
    //     processCssUrls: false
    // });
