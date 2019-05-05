<?php

namespace PHPixie\Tests\Slice\Type\ArrayData;

/**
 * @coversDefaultClass \PHPixie\Slice\Type\ArrayData\Slice
 */
class SliceTest extends \PHPixie\Tests\Slice\Type\ArrayDataTest
{
    protected $path = 'trixie';
    
    /**
     * @covers ::path
     * @covers ::<protected>
     */
    public function testPath()
    {
        $this->assertSame($this->path, $this->sliceData->path());
        $this->assertSame($this->path.'.name', $this->sliceData->path('name'));
    }
    
    protected function sliceData()
    {
        return new \PHPixie\Slice\Type\ArrayData\Slice(
            $this->sliceBuilder,
            $this->data,
            $this->path
        );
    }
}
