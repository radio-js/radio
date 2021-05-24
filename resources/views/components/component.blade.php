@php
if (! isset($is)) {
    throw new Exception('[Radio] You must provide an `is` attribute when using the `radio::component` component.');
}

if (! class_exists($is)) {
    throw new Exception('[Radio] The `'.$is.'` class does not exist.');
}

$__radioData = collect(get_defined_vars())->filter(function ($value, $key) {
    return !str_starts_with($key, '__') && ! in_array($key, ['app', 'errors', 'slot', 'attributes', 'is']);
});
@endphp

<div x-data="@radio($is, $__radioData->all())">
    {{ $slot }}
</div>