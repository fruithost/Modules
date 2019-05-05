<?php

namespace PHPixie\Filesystem\Locators\Locator;

class Group
{
    protected $locatorBuilder;
    protected $locatorsConfig;
    
    protected $locators;
    
    public function __construct($locatorBuilder, $configData)
    {
        $this->locatorBuilder = $locatorBuilder;
        $this->locatorsConfig = $configData->slice('locators');
    }
    
    protected function locators()
    {
        if($this->locators === null) {
            $this->locators = array();
            foreach($this->locatorsConfig->keys(null, true) as $key) {
                $locatorConfig = $this->locatorsConfig->slice($key);
                $this->locators[] = $this->locatorBuilder->buildFromConfig($locatorConfig);
            }
        }
        
        return $this->locators;
    }
    
    public function locate($name, $isDirectory = false)
    {
        $path = null;
        foreach($this->locators() as $locator) {
            $path = $locator->locate($name, $isDirectory);
            if($path !== null) {
                break;
            }
        }
        
        return $path;
    }
}