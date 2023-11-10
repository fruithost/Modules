<?php

namespace PHPixie\Filesystem;

class Builder
{
    protected $locators;
    protected $actions;
    
    public function __construct()
    {
        
    }
    
    public function root($directory)
    {
        return new Root($directory);
    }
    
    public function locators()
    {
        if($this->locators === null) {
            $this->locators = $this->buildLocators();
        }
        
        return $this->locators;
    }
    
    public function actions()
    {
        if($this->actions === null) {
            $this->actions = $this->buildActions();
        }
        
        return $this->actions;
    }
    
    protected function buildLocators()
    {
        return new Locators($this);
    }
    
    protected function buildActions()
    {
        return new Actions();
    }
}