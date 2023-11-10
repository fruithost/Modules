<?php

namespace PHPixie\Tests\Filesystem;

/**
 * @coversDefaultClass \PHPixie\Filesystem\Builder
 */
class BuilderTest extends \PHPixie\Test\Testcase
{
    protected $builders;
    
    public function setUp()
    {
        $this->builder = new \PHPixie\Filesystem\Builder();
    }
    
    /**
     * @covers ::__construct
     * @covers ::<protected>
     */
    public function testConstruct()
    {
        
    }
    
    /**
     * @covers ::root
     * @covers ::<protected>
     */
    public function testRoot()
    {
        $root = $this->builder->root('/pixie/');
        $this->assertInstance($root, '\PHPixie\Filesystem\Root', array(
            'path' => '/pixie/'
        ));
    }
    
    /**
     * @covers ::locators
     * @covers ::<protected>
     */
    public function testLocators()
    {
        $locators = $this->builder->locators();
        $this->assertInstance($locators, '\PHPixie\Filesystem\Locators', array(
            'builder' => $this->builder
        ));
        
        $this->assertSame($locators, $this->builder->locators());
    }
}