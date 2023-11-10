<?php

namespace PHPixie\Slice\Type;

class Merge extends \PHPixie\Slice\Data\Implementation
{
    protected $baseData;
    protected $overrideData;
    protected $nullObject;

    public function __construct($sliceBuilder, $baseData, $overrideData)
    {
        parent::__construct($sliceBuilder);
        $this->baseData = $baseData;
        $this->overrideData = $overrideData;
        $this->nullObject = new \stdClass();
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
        $base = $this->baseData->get($path, $this->nullObject);
        $override = $this->overrideData->get($path, $this->nullObject);

        $baseIsNull = $base === $this->nullObject;
        $overrideIsNull = $override === $this->nullObject;

        if($baseIsNull && $overrideIsNull) {
            if($isRequired) {
                throw new \PHPixie\Slice\Exception("Data for '$path' is not set.");
            }

            return $default;
        }

        if($overrideIsNull) {
            return $base;
        }

        if($baseIsNull || !is_array($override) || !is_array($base)) {
            return $override;
        }

        return array_replace_recursive($base, $override);
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
        return new \ArrayIterator($this->getData(null, false, array()));
    }
}
