<?php

namespace PHPixie\Slice\Type;

class Slice extends \PHPixie\Slice\Data\Implementation
{
    protected $data;
    protected $path;

    public function __construct($sliceBuilder, $data = null, $path = null)
    {
        $this->data = $data;
        $this->path = $path;
        parent::__construct($sliceBuilder);
    }

    public function getData($path = null, $isRequired = false, $default = null)
    {
        $path = $this->dataPath($path);
        return $this->data->getData($path, $isRequired, $default);
    }

    public function slice($path = null)
    {
        return $this->data->slice($this->dataPath($path));
    }
    
    public function arraySlice($path = null)
    {
        return $this->data->arraySlice($this->dataPath($path));
    }
    
    public function keys($path = null, $isRequired = false)
    {
        return $this->data->keys($this->dataPath($path), $isRequired);
    }

    public function path($path = null)
    {
        $path = $this->dataPath($path);
        
        if($this->data instanceof \PHPixie\Slice\Data\Slice) {
            $path = $this->data->path($path);
        }
        
        return $path;
    }
    
    public function getIterator()
    {
        return $this->sliceBuilder->iterator($this);
    }
    
    protected function dataPath($path)
    {
        return $this->mergePath($this->path, $path);
    }
}
