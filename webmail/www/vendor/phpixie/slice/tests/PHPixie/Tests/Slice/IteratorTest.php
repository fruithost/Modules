<?php

namespace PHPixie\Tests\Slice;

/**
 * @coversDefaultClass \PHPixie\Slice\Iterator
 */
class IteratorTest extends \PHPixie\Test\Testcase
{
    protected $sliceData;
    
    protected $iterator;
    
    protected $data = array(
        'name'  => 'Pixie',
        'magic' => 'Nature',
        'spell' => 'Rain'
    );
    
    public function setUp()
    {
        $this->sliceData = $this->abstractMock('\PHPixie\Slice\Data');
        $this->method($this->sliceData, 'keys', array_keys($this->data), array());
        
        $data = $this->data;
        $this->method($this->sliceData, 'getRequired', function ($key) use($data) {
            return $data[$key];
        });
        
        $this->iterator = new \PHPixie\Slice\Iterator($this->sliceData);
    }
    
    /**
     * @covers ::__construct
     * @covers ::<protected>
     */
    public function testConstruct()
    {
        
    }
    
    /**
     * @covers ::current
     * @covers ::valid
     * @covers ::key
     * @covers ::next
     * @covers ::rewind
     * @covers ::<protected>
     */
    public function testIterator()
    {
        $this->assertSame($this->data, iterator_to_array($this->iterator));
    }
}