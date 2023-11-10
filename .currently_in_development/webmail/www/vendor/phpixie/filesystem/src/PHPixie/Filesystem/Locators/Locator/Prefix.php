<?php

namespace PHPixie\Filesystem\Locators\Locator;

class Prefix implements \PHPixie\Filesystem\Locators\Locator,
                        \PHPixie\Filesystem\Locators\Registry
{
    protected $locatorBuilder;
    protected $locatorsConfig;
    protected $defaultPrefix;
    
    protected $locators = array();
    
    public function __construct($locatorBuilder, $configData)
    {
        $this->locatorBuilder = $locatorBuilder;
        $this->locatorsConfig = $configData->slice('locators');
        $this->defaultPrefix  = $configData->get('defaultPrefix', 'default');
    }
    
    public function get($name, $checkMissing = false)
    {
        if(!array_key_exists($name, $this->locators)) {
            if($checkMissing && !array_key_exists($name, $this->locatorsConfig->get())) {
                return null;
            }
            
            $locatorConfig = $this->locatorsConfig->slice($name);
            $this->locators[$name] = $this->locatorBuilder->buildFromConfig($locatorConfig);
        }
        
        return $this->locators[$name];
    }
    
    public function locate($name, $isDirectory = false)
    {
        $split = explode(':', $name, 2);
        if(count($split) > 1) {
            list($prefix, $name) = $split;
            
        }else{
            $prefix = $this->defaultPrefix;
            $name = $name;
        }
        
        $locator = $this->get($prefix, true);
        if($locator === null) {
            return null;
        }
        return $locator->locate($name, $isDirectory);
    }
}
