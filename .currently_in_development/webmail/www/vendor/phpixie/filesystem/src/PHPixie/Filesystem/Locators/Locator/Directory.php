<?php

namespace PHPixie\Filesystem\Locators\Locator;

class Directory implements \PHPixie\Filesystem\Locators\Locator
{
    protected $root;
    protected $directory;
    protected $defaultExtension;
    
    public function __construct($root, $configData)
    {
        $this->root             = $root;
        $this->directory        = $configData->getRequired('directory');
        $this->defaultExtension = $configData->get('defaultExtension', 'php');
    }
    
    public function locate($path, $isDirectory = false)
    {
        $path = $this->directory.'/'.$path;
        $path = $this->root->path($path);
        
        if(!$isDirectory) {
            $extension = pathinfo($path, PATHINFO_EXTENSION);
            if($extension === '') {
                $path.='.'.$this->defaultExtension;
            }
            
            if(file_exists($path)) {
                return $path;
            }
        
        }elseif(is_dir($path)){
            return $path;
        }
        
        return null;
    }
}