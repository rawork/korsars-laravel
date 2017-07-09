<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('layouts/index');
});

Route::get('lawbook', function () {
    return view('lawbook');
});

//Route::get('tavern', function () {
//    return view('welcome');
//});
//Route::get('pirates', function () {
//    return view('welcome');
//});
//Route::get('crew', function () {
//    return view('welcome');
//});
//Route::get('cabin', function () {
//    return view('welcome');
//});
//Route::get('ship', function () {
//    return view('welcome');
//});
//Route::get('panel', function () {
//    return view('welcome');
//});
