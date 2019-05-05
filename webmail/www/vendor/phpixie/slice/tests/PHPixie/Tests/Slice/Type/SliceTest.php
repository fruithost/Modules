<?php

namespace PHPixie\Tests\Slice\Type;

/**
 * @coversDefaultClass \PHPixie\Slice\Type\Slice
 */
class SliceTest extends \PHPixie\Tests\Slice\Data\ImplementationTest
{
    protected $data;
    protected $path = 'pixie';
    
    public function setUp()
    {
        $this->data = $this->getData();
        parent::setUp();
    }
    
    /**
     * @covers ::keys
     * @covers ::<protected>
     */
    public function testKeys()
    {
        $keys = array('test');
        $namesPath = $this->path.'.names';
        
        $this->method($this->data, 'keys', $keys, array($namesPath, false), 0);
        $this->assertSame($keys, $this->sliceData->keys('names'));
        
        $this->method($this->data, 'keys', $keys, array($namesPath, true), 0);
        $this->assertSame($keys, $this->sliceData->keys('names', true));
        
        $this->method($this->data, 'keys', $keys, array($this->path, false), 0);
        $this->assertSame($keys, $this->sliceData->keys());
    }
    
    /**
     * @covers ::slice
     * @covers ::<protected>
     */
    public function testSlice()
    {
        $slice = $this->getSlice();
        $namesPath = $this->path.'.names';
        
        $this->method($this->data, 'slice', $slice, array($namesPath), 0);
        $this->assertSame($slice, $this->sliceData->slice('names'));
        
        $this->method($this->data, 'slice', $slice, array($this->path), 0);
        $this->assertSame($slice, $this->sliceData->slice());
    }
    
    /**
     * @covers ::arraySlice
     * @covers ::<protected>
     */
    public function testArraySlice()
    {
        $slice = $this->getArraySlice();
        $namesPath = $this->path.'.names';
        
        $this->method($this->data, 'arraySlice', $slice, array($namesPath), 0);
        $this->assertSame($slice, $this->sliceData->arraySlice('names'));
        
        $this->method($this->data, 'arraySlice', $slice, array($this->path), 0);
        $this->assertSame($slice, $this->sliceData->arraySlice());
    }
    
    /**
     * @covers ::path
     * @covers ::<protected>
     */
    public function testPath()
    {
        $this->assertSame($this->path, $this->sliceData->path());
        $this->assertSame($this->path.'.name', $this->sliceData->path('name'));
    }
    
    /**
     * @covers ::path
     * @covers ::<protected>
     */
    public function testSlicePath()
    {
        $this->data = $this->abstractMock('\PHPixie\Slice\Data\Slice');
        $this->sliceData = $this->sliceData();
        
        $this->method($this->data, 'path', 'fairy.pixie', array('pixie'), 0);
        $this->assertSame('fairy.pixie', $this->sliceData->path());
        
        $this->method($this->data, 'path', 'fairy.pixie.names', array('pixie.names'), 0);
        $this->assertSame('fairy.pixie.names', $this->sliceData->path('names'));
    }
    
    protected function prepareGetDataSets()
    {
        $sets = array();
        $namePath = $this->path.'.name';
        
        $this->method($this->data, 'getData', 5, array($namePath, false, null), 0);
        $sets[] = array('get', array('name'), 5);
        
        $this->method($this->data, 'getData', 5, array($namePath, true, null), 1);
        $sets[] = array('getRequired', array('name'), 5);
        
        $this->method($this->data, 'getData', 5, array($namePath, true, 4), 2);
        $sets[] = array('getData', array('name', true, 4), 5);
        
        $this->method($this->data, 'getData', 5, array($this->path, false, null), 3);
        $sets[] = array('get', array(), 5);
        
        $this->method($this->data, 'getData', 5, array($this->path, true, null), 4);
        $sets[] = array('getRequired', array(), 5);
        
        $this->method($this->data, 'getData', 5, array($this->path, true, 4), 5);
        $sets[] = array('getData', array(null, true, 4), 5);
        
        $this->method($this->data, 'getData', 5, array($namePath, false, 4), 6);
        $sets[] = array('get', array('name', 4), 5);
        
        return $sets;
    }
    
    /**
     * @covers ::getIterator
     * @covers ::<protected>
     */
    public function testIterator()
    {
        $iterator = $this->getIterator();
        $this->method($this->sliceBuilder, 'iterator', $iterator, array($this->sliceData), 0);
        $this->assertSame($iterator, $this->sliceData->getIterator());
    }
    
    protected function getData()
    {
        return $this->abstractMock('\PHPixie\Slice\Data');
    }
    
    protected function getSlice()
    {
        return $this->abstractMock('\PHPixie\Slice\Data\Slice');
    }
    
    protected function sliceData()
    {
        return new \PHPixie\Slice\Type\Slice(
            $this->sliceBuilder,
            $this->data,
            $this->path
        );
    }
}
