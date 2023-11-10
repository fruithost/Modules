<?php

namespace PHPixie\Tests\Slice\Type\ArrayData;

/**
 * @coversDefaultClass \PHPixie\Slice\Type\ArrayData\Editable
 */
class EditableTest extends \PHPixie\Tests\Slice\Type\ArrayDataTest
{
    /**
     * @covers ::set
     * @covers ::<protected>
     */
    public function testSet()
    {
        $this->sliceData->set('meadow.grass_type', 8);
        $this->assertEquals(8, $this->sliceData-> get('meadow.grass_type'));
        $this->sliceData->set('meadow.trail.length', 8);
        $this->assertEquals(8, $this->sliceData-> get('meadow.trail.length'));
        $this->assertSliceException(function () {
            $this->sliceData-> set('meadow.grass_type.pixies', 8);
        });
        $this->sliceData->set('meadow', array(
            'grass_type' => 6,
            'fairies' => array(
                'names' => array('Pixie')
            )
        ));
        $this->assertEquals('Pixie', $this->sliceData->get('meadow.fairies.names.0'));
        $this->assertEquals(1, $this->sliceData-> get('meadow.trees.oak', 1));
        $this->sliceData->set(null, array('test' => 5));
        $this->assertEquals('5', $this->sliceData-> get('test'));
        
        $sliceData = $this->sliceData;
        $this->assertSliceException(function () use($sliceData) {
            $sliceData->set(null, 5);
        });
    }
    
    /**
     * @covers ::remove
     * @covers ::getData
     * @covers ::<protected>
     */
    public function testRemove()
    {
        $this->sliceData->remove('meadow.grass_type');
        $this->assertEquals('test', $this->sliceData->get('meadow.grass_type', 'test'));
        $this->sliceData->remove('meadow.fairies');
        $this->assertEquals('test', $this->sliceData->get('meadow.fairies,names', 'test'));
        $this->sliceData->remove();
        $this->assertEquals('test', $this->sliceData->get('meadow', 'test'));
        $this->assertEquals('test', $this->sliceData->get(null, 'test'));
        
        $sliceData = $this->sliceData;
        $this->assertSliceException(function () use($sliceData) {
            $sliceData->getRequired();
        });
    }
    
    /**
     * @covers ::slice
     * @covers ::<protected>
     */
    public function testSlice()
    {
        $slice = $this->getSlice();
        
        $this->method($this->sliceBuilder, 'editableSlice', $slice, array($this->sliceData, null), 0);
        $this->assertSame($slice, $this->sliceData->slice());
        
        $this->method($this->sliceBuilder, 'editableSlice', $slice, array($this->sliceData, 'pixie'), 0);
        $this->assertSame($slice, $this->sliceData->slice('pixie'));
    }
    
    /**
     * @covers ::remove
     * @covers ::getData
     * @covers ::<protected>
     */
    public function testRemoveCreate()
    {
        $this->sliceData->remove();
        $this->sliceData->set('meadow.grass_type', 8);
        $this->assertEquals(8, $this->sliceData-> get('meadow.grass_type'));
    }
    
    protected function sliceData()
    {
        return new \PHPixie\Slice\Type\ArrayData\Editable(
            $this->sliceBuilder,
            $this->data
        );
    }
}
