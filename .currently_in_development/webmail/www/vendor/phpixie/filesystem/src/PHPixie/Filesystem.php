<?php

namespace PHPixie;

class Filesystem
{
    protected $builder;
    
    public function __construct()
    {
        $this->builder = $this->buildBuilder();
    }
    
    public function builder()
    {
        return $this->builder;
    }
    
    public function root($directory)
    {
        return $this->builder->root($directory);
    }
    
    public function actions()
    {
        return $this->builder->actions();
    }
    
    public function buildLocator($configData, $root, $locatorRegistry = null)
    {
        $locators = $this->builder->locators();
        $builder  = $locators->builder($root, $locatorRegistry);
        return $builder->buildFromConfig($configData);
    }
    
    protected function buildBuilder()
    {
        return new Filesystem\Builder();
    }
}