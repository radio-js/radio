<?php

declare(strict_types = 1);

namespace Radio\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CallController
{
    public function __invoke(Request $request): JsonResponse
    {
        $component = app($request->input('component'));

        $component->hydrateRadioState(
            $request->input('state'),
        );

        $result = $component->callRadioMethod(
            $request->input('method'),
            array_values($request->input('args')),
        );

        if ($result instanceof RedirectResponse) {
            $result = [
                'type' => 'redirect',
                'target' => $result->getTargetUrl(),
            ];
        }

        return response()->json(array_merge([
            'result' => $result,
        ], $component->dehydrateRadioData()));
    }
}
