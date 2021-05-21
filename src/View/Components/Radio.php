<?php

namespace Radio\View\Components;

use Illuminate\View\Component;

class Radio extends Component
{
    public function __construct(
        public string $is
    ) {}

    public function render()
    {
        return view('radio::components.radio');
    }
}