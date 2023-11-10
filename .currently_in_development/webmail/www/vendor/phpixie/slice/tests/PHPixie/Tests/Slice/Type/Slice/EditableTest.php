<?php

namespace PHPixie\Tests\Slice\Type\Slice;

/**
 * @coversDefaultClass \PHPixie\Slice\Type\Slice\Editable
 */
class EditableTest extends \PHPixie\Tests\Slice\Type\SliceTest
{
    /**
     * @covers ::set
     * @covers ::<protected>
     */
    public function testSet()
    {
        $namePath = $this->path.'.name';
        
        $this->method($this->data, 'set', null, array($namePath, 5), 0);
        $this->sliceData->set('name', 5);
        
        $this->method($this->data, 'set', null, array($this->path, 5), 0);
        $this->sliceData->set(null, 5);
    }
    
    /**
     * @covers ::remove
     * @covers ::<protected>
     */
    public function testRemove()
    {
        $this->method($this->data, 'remove', null, array($this->path.'.name'), 0);
        $this->sliceData->remove('name');
        
        $this->method($this->data, 'remove', null, array($this->path), 0);
        $this->sliceData->remove();
    }
    
    protected function getData()
    {
        return $this->abstractMock('\PHPixie\Slice\Data\Editable');
    }
    
    protected function sliceData()
    {
        return new \PHPixie\Slice\Type\Slice\Editable(
            $this->sliceBuilder,
            $this->data,
            $this->path
        );
    }
}
