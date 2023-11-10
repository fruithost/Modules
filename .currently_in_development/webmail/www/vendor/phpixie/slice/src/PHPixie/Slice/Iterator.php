<?php

namespace PHPixie\Slice;

class Iterator implements \Iterator
{
    protected $data;
    protected $keys;
    
    protected $keyOffset;
    protected $keyCount;
    protected $currentKey;
    
    public function __construct($data)
    {
        $this->data = $data;
        $this->rewind();
    }
    
    public function current()
    {
        return $this->data->getRequired($this->currentKey);
    }
    
    public function key()
    {
        return $this->currentKey;
    }
    
    public function next()
    {
        $this->keyOffset++;
        if($this->valid()) {
            $this->currentKey = $this->keys[$this->keyOffset];
        }
    }
        
    public function rewind()
    {
        $this->keys = $this->data->keys();
        
        $this->keyOffset  = 0;
        $this->keyCount   = count($this->keys);
        $this->currentKey = $this->keys[$this->keyOffset];
    }
    
    public function valid()
    {
        return $this->keyOffset < $this->keyCount;
    }
}