<?php

namespace PHPixie\Filesystem\Locators;

class Builder
{
    protected $locators;
    protected $root;
    protected $locatorRegistry;
    
    public function __construct($locators, $root, $locatorRegistry = null)
    {
        $this->locators        = $locators;
        $this->root            = $root;
        $this->locatorRegistry = $locatorRegistry;        
    }
    
    protected function directory($configData)
    {
        return $this->locators->directory($this->root, $configData);
    }
    
    protected function group($configData)
    {
        return $this->locators->group($this, $configData);
    }
    
    protected function prefix($configData)
    {
        return $this->locators->prefix($this, $configData);
    }
    
    protected function mount($configData)
    {
        if ($this->locatorRegistry === null) {
            throw new \PHPixie\Filesystem\Exception("Locator registry was not set");
        }
        
        return $this->locators->mount($this->locatorRegistry, $configData);
    }
    
    public function buildFromConfig($configData) {
        $type = $configData->get('type', 'directory');
        return $this->$type($configData);
    }
}