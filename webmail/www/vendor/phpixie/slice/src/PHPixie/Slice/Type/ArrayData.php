<?php

namespace PHPixie\Slice\Type;

class ArrayData extends \PHPixie\Slice\Data\Implementation
{
    protected $data;

    public function __construct($sliceBuilder, $data = array())
    {
        parent::__construct($sliceBuilder);
        $this->data = $data;
    }

    /**
     * @return array
     * @throws \PHPixie\Slice\Exception
     */
    public function keys($path = null, $isRequired = false)
    {
        $data = $this->getData($path, $isRequired, array());
        return array_keys($data);
    }

    /**
     * @return array|null
     * @throws \PHPixie\Slice\Exception
     */
    public function getData($path = null, $isRequired = false, $default = null)
    {
        if ($path !== null) {
            list($parentPath, $key) = $this->splitPath($path);
            $parent = &$this->findGroup($parentPath);
            if ($parent !== null && array_key_exists($key, $parent)) {
                return $parent[$key];
            }
            
        }elseif(!empty($this->data)) {
            return $this->data;
            
        }
        
        if (!$isRequired) {
            return $default;
        }
        
        throw new \PHPixie\Slice\Exception("Data for '$path' is not set.");
    }

    /**
     * @param null $path
     * @return \PHPixie\Slice\Type\ArrayData\Slice
     */
    public function slice($path = null)
    {
        return $this->arraySlice($path);
    }

    /**
     * @param null $path
     * @return \PHPixie\Slice\Type\ArrayData\Slice
     */
    public function arraySlice($path = null)
    {
        $data = $this->get($path);
        return $this->sliceBuilder->arraySlice($data, $path);
    }
    
    public function getIterator()
    {
        return new \ArrayIterator($this->data);
    }
    
    protected function splitPath($path)
    {
        $path = explode('.', $path);
        $key = array_pop($path);
        return array($path, $key);
    }
    
    protected function &findGroup($path, $createMissing = false) {
        $null = null;
        
        if(!is_array($this->data)) {
            return $null;
        }
        
        $group = &$this->data;
        
        foreach ($path as $i => $key) {

            if (!array_key_exists($key, $group)) {
                if (!$createMissing) {
                    return $null;
                }

                $group[$key] = array();
            }

            if (!is_array($group[$key])) {
                if (!$createMissing) {
                    return $null;
                }

                throw new \PHPixie\Slice\Exception("An element with key '$key' is not an array.");
            }

            $group = &$group[$key];
        }

        return $group;
    }

}
