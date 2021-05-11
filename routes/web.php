<?php

declare(strict_types = 1);

use Aerial\Http\Controllers\CallController;
use Illuminate\Support\Facades\Route;

Route::post('/aerial/call', CallController::class)->middleware('signed')->name('aerial.call');
