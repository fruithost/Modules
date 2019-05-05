<?php

namespace PHPixie\Filesystem;

class Root
{
    protected $path;
    
    public function __construct($path)
    {
        if(substr($path, -1) !== '/') {
            $path.= '/';
        }
        
        $this->path = $path;
    }
    
    public function path($path = null)
    {
        return $this->path.$path;
    }
}
