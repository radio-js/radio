<?php

declare(strict_types = 1);

namespace Radio\Concerns;

use ReflectionProperty;
use ReflectionAttribute;
use Radio\Contracts\Castable;
use Radio\Attributes\Computed;
use Radio\Attributes\EagerLoad;
use Illuminate\Support\Collection;
use Illuminate\Support\Stringable;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;

trait WithState
{
    public function hydrateRadioState(array $state = [], array $meta = []): void
    {
        $this->callRadioHook('hydrating');

        $reflection = $this->getReflection();

        foreach ($state as $key => $value) {
            if (! property_exists($this, $key)) continue;

            /** @var \ReflectionProperty $property */
            $property = $reflection->getProperty($key);

            $this->{$key} = $this->transformRadioPropertyValueForHydration(
                $key,
                $value,
                $property->hasType() ? $property->getType()->getName() : null,
                array_merge($meta, [
                    'attributes' => collect($property->getAttributes())->mapWithKeys(function (ReflectionAttribute $attribute) {
                        return [$attribute->getName() => $attribute->newInstance()];
                    })->toArray()
                ])
            );
        }

        $this->callRadioHook('hydrated');
    }

    protected function transformRadioPropertyValueForHydration(string $key, $value, ?string $type = null, array $meta = [])
    {
        if ($type) {
            if (is_subclass_of($type, Model::class) && data_get($meta, "models.{$key}") !== null) {
                $primaryKey = data_get($meta, "models.{$key}.key");
                $columns = json_decode(Crypt::decryptString(data_get($meta, "models.{$key}.columns")), true);

                $model = $type::query()
                    ->when(array_key_exists(EagerLoad::class, $meta['attributes']), function ($query) use ($meta) {
                        $query->with(
                            $meta['attributes'][EagerLoad::class]->relationships
                        );
                    })
                    ->findOrFail(
                        Crypt::decryptString($primaryKey)
                    );
                
                foreach ($value as $column => $data) {
                    if (! array_key_exists($column, $columns)) continue;
                    if ($column === $model->getKeyName()) continue;

                    $model->{$column} = $data;
                }

                $value = $model;
            } elseif ($type === Collection::class) {
                $value = Collection::make($value);
            } elseif ($type === EloquentCollection::class) {
                $value = EloquentCollection::make($value);
            } elseif ($type === Stringable::class) {
                $value = new Stringable($value);
            } elseif (class_exists($type) && in_array(Castable::class, class_implements($type))) {
                $value = $type::fromRadio($value);
            }
        }

        return $value;
    }

    public function dehydrateRadioState(): array
    {
        $models = collect();

        $state = collect(
            $this->getReflection()->getProperties(ReflectionProperty::IS_PUBLIC),
        )
            ->mapWithKeys(function (ReflectionProperty $property) {
                return [$property->getName() => $this->transformRadioPropertyValueForDehydration(
                    $property->getValue($this),
                    $property->getAttributes()
                )];
            })
            ->map(function ($value, string $key) use ($models) {
                if ($value instanceof Model) {
                    $models[$key] = [
                        'key' => Crypt::encryptString($value->getKey()),
                        'columns' => Crypt::encryptString(json_encode($value->attributesToArray()))
                    ];

                    return $value->attributesToArray();
                }

                return $value;
            });

        return [
            'state' => $state,
            'models' => $models,
        ];
    }

    protected function transformRadioPropertyValueForDehydration($value, array $attributes = [])
    {
        if ($value instanceof Stringable) {
            $value = $value->__toString();
        } elseif ($value instanceof Castable) {
            $value = $value->toRadio();
        }

        /** @var \ReflectionAttribute[] $attributes */
        foreach ($attributes as $attribute) {
            $attribute = $attribute->newInstance();

            if ($attribute instanceof Computed) {
                $value = $this->{$attribute->method}();
            }
        }

        return $value;
    }
}