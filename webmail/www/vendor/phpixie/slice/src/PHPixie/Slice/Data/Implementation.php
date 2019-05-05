<?php

namespace PHPixie\Slice\Data;

abstract class Implementation implements \PHPixie\Slice\Data
{
    protected $sliceBuilder;

    /**
     * @param \PHPixie\Slice $sliceBuilder
     */
    public function __construct($sliceBuilder)
    {
        $this->sliceBuilder = $sliceBuilder;
    }

    /**
     * @return array|string|null
     */
    public function get($key = null, $default = null)
    {
        return $this->getData($key, false, $default);
    }

    /**
     * @return array|string|null
     */
    public function getRequired($key = null)
    {
        return $this->getData($key, true);
    }

    /**
     * @return string
     */
    protected function mergePath($prefix, $path = null)
    {
        if($prefix === null)
            return $path;

        if ($path === null)
            return $prefix;

        return $prefix.'.'.$path;
    }
}
