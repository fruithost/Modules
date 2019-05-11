<?php

namespace PHPixie\Slice;

interface Data extends \IteratorAggregate
{
    public function get($path = null, $default = null);
    public function getRequired($path = null);
    public function getData($path = null, $isRequired = false, $default = null);
    
    public function keys($path = null, $isRequired = false);
    public function slice($path = null);
    public function arraySlice($path = null);
}
