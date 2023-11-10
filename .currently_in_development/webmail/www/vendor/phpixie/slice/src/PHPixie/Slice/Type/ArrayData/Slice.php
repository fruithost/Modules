<?php

namespace PHPixie\Slice\Type\ArrayData;

class Slice extends    \PHPixie\Slice\Type\ArrayData
            implements \PHPixie\Slice\Data\Slice
{
    protected $path;

    public function __construct($sliceBuilder, $data = null, $path = null)
    {
        parent::__construct($sliceBuilder, $data);
        $this->path = $path;
    }
    
    public function path($path = null)
    {
        return $this->mergePath($this->path, $path);
    }
}
