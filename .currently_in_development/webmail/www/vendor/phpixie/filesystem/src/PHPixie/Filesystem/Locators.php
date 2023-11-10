<?php

namespace PHPixie\Filesystem;

class Locators
{
    protected $builder;
    protected $locatorRegistry;
    
    public function __construct($builder)
    {
        $this->builder = $builder;
    }
    
    public function directory($root, $configData)
    {
        return new Locators\Locator\Directory(
            $root,
            $configData
        );
    }
    
    public function group($locatorBuilder, $configData)
    {
        return new Locators\Locator\Group(
            $locatorBuilder,
            $configData
        );
    }
    
    public function prefix($locatorBuilder, $configData)
    {
        return new Locators\Locator\Prefix(
            $locatorBuilder,
            $configData
        );
    }
    
    public function mount($locatorRegistry, $configData)
    {
        return new Locators\Locator\Mount(
            $locatorRegistry,
            $configData
        );
    }
    
    public function builder($root, $locatorRegistry = null)
    {
        return new Locators\Builder(
            $this,
            $root,
            $locatorRegistry
        );
    }
}