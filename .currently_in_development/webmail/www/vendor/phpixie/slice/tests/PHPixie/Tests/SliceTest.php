<?php

namespace PHPixie\Tests;

/**
 * @coversDefaultClass \PHPixie\Slice
 */
class SliceTest extends \PHPixie\Test\Testcase
{
    protected $slice;

    public function setUp()
    {
        $this->slice = new \PHPixie\Slice();
    }

    /**
     * @covers ::iterator
     * @covers ::<protected>
     */
    public function testIterator()
    {
        $data = $this->getData();

        $iterator = $this->slice->iterator($data);
        $this->assertInstance($iterator, '\PHPixie\Slice\Iterator', array(
            'data' => $data
        ));
    }

    /**
     * @covers ::slice
     * @covers ::<protected>
     */
    public function testSlice()
    {
        $data = $this->getData();

        $slice = $this->slice->slice($data);
        $this->assertInstance($slice, '\PHPixie\Slice\Type\Slice', array(
            'sliceBuilder' => $this->slice,
            'data' => $data,
            'path' => null
        ));

        $slice = $this->slice->slice($data, 'pixie');
        $this->assertInstance($slice, '\PHPixie\Slice\Type\Slice', array(
            'sliceBuilder' => $this->slice,
            'data' => $data,
            'path' => 'pixie'
        ));
    }

    /**
     * @covers ::editableSlice
     * @covers ::<protected>
     */
    public function testEditableSlice()
    {
        $data = $this->getData(true);

        $slice = $this->slice->editableSlice($data);
        $this->assertInstance($slice, '\PHPixie\Slice\Type\Slice\Editable', array(
            'sliceBuilder' => $this->slice,
            'data' => $data,
            'path' => null
        ));

        $slice = $this->slice->editableSlice($data, 'pixie');
        $this->assertInstance($slice, '\PHPixie\Slice\Type\Slice\Editable', array(
            'sliceBuilder' => $this->slice,
            'data' => $data,
            'path' => 'pixie'
        ));
    }

    /**
     * @covers ::arraySlice
     * @covers ::<protected>
     */
    public function testArraySlice()
    {
        $data = array('name' => 'Trixie');

        $arrayData = $this->slice->arraySlice($data, 'pixie');
        $this->assertInstance($arrayData, '\PHPixie\Slice\Type\ArrayData\Slice', array(
            'sliceBuilder' => $this->slice,
            'data' => $data,
            'path' => 'pixie'
        ));

        $arrayData = $this->slice->arraySlice(null);
        $this->assertInstance($arrayData, '\PHPixie\Slice\Type\ArrayData\Slice', array(
            'sliceBuilder' => $this->slice,
            'data' => null,
            'path' => null
        ));
    }

    /**
     * @covers ::arrayData
     * @covers ::<protected>
     */
    public function testArrayData()
    {
        $data = array('name' => 'Trixie');

        $arrayData = $this->slice->arrayData($data);
        $this->assertInstance($arrayData, '\PHPixie\Slice\Type\ArrayData', array(
            'sliceBuilder' => $this->slice,
            'data' => $data
        ));

        $arrayData = $this->slice->arrayData(null);
        $this->assertInstance($arrayData, '\PHPixie\Slice\Type\ArrayData', array(
            'sliceBuilder' => $this->slice,
            'data' => null
        ));
    }

    /**
     * @covers ::editableArrayData
     * @covers ::<protected>
     */
    public function testEditableArrayData()
    {
        $data = array('name' => 'Trixie');

        $arrayData = $this->slice->editableArrayData($data);
        $this->assertInstance($arrayData, '\PHPixie\Slice\Type\ArrayData\Editable', array(
            'sliceBuilder' => $this->slice,
            'data' => $data
        ));

        $arrayData = $this->slice->editableArrayData(null);
        $this->assertInstance($arrayData, '\PHPixie\Slice\Type\ArrayData\Editable', array(
            'sliceBuilder' => $this->slice,
            'data' => null
        ));
    }

    /**
     * @covers ::mergeData
     * @covers ::<protected>
     */
    public function testMergeData()
    {
        $baseData = $this->quickMock('\PHPixie\Slice\Data');
        $overrideData = $this->quickMock('\PHPixie\Slice\Data');

        $mergeData = $this->slice->mergeData($baseData, $overrideData);
        $this->assertInstance($mergeData, '\PHPixie\Slice\Type\Merge', array(
            'sliceBuilder' => $this->slice,
            'baseData' => $baseData,
            'overrideData' => $overrideData
        ));
    }

    public function getData($editable = false)
    {
        if($editable) {
            return $this->abstractMock('\PHPixie\Slice\Data\Editable');
        }

        return $this->abstractMock('\PHPixie\Slice\Data');
    }
}
