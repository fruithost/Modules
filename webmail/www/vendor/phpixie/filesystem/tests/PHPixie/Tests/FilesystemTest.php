<?php

namespace PHPixie\Tests;

/**
 * @coversDefaultClass \PHPixie\Filesystem
 */
class FilesystemTest extends \PHPixie\Test\Testcase
{
    protected $filesystem;
    
    protected $builder;
    
    protected $root;
    protected $locators;
    
    public function setUp()
    {
        $this->filesystem = $this->getMockBuilder('\PHPixie\Filesystem')
            ->setMethods(array('buildBuilder'))
            ->disableOriginalConstructor()
            ->getMock();
        
        $this->builder = $this->quickMock('\PHPixie\Filesystem\Builder');
        $this->method($this->filesystem, 'buildBuilder', $this->builder, array(), 0);
        
        $this->filesystem->__construct();
        
        $this->locators = $this->quickMock('\PHPixie\Filesystem\Locators');
        $this->method($this->builder, 'locators', $this->locators, array());
    }
    
    /**
     * @covers ::__construct
     * @covers ::<protected>
     */
    public function testConstructor()
    {
        
    }
    
    /**
     * @covers ::builder
     * @covers ::<protected>
     */
    public function testBuilder()
    {
        $this->assertSame($this->builder, $this->filesystem->builder());
    }
    
    /**
     * @covers ::root
     * @covers ::<protected>
     */
    public function testRoot()
    {
        $root = $this->quickMock('\PHPixie\Filesystem\Root');
        $this->method($this->builder, 'root', $root, array('/pixie'), 0);

        $this->assertSame($root, $this->filesystem->root('/pixie'));
    }
    
    /**
     * @covers ::buildLocator
     * @covers ::<protected>
     */
    public function testBuildLocator()
    {
        $configData = $this->quickMock('\PHPixie\Slice\Data');
        $root       = $this->quickMock('\PHPixie\Filesystem\Root');
        
        $builder = $this->quickMock('\PHPixie\Filesystem\Locators\Builder');
        $locator = $this->quickMock('\PHPixie\Filesystem\Locators\Locator');
        
        $this->method($builder, 'buildFromConfig', $locator, array($configData));
        
        foreach(array(false, true) as $withLocatorRegistry) {
            if($withLocatorRegistry) {
                $locatorRegistry = $this->quickMock('\PHPixie\Filesystem\Locators\Registry');
            }else{
                $locatorRegistry = null;
            }
            
            $this->method($this->locators, 'builder', $builder, array($root, $locatorRegistry), 0);
            
            $params = array($configData, $root);
            if($withLocatorRegistry) {
                $params[]= $locatorRegistry;
            }
            
            $result = call_user_func_array(array($this->filesystem, 'buildLocator'), $params);
            $this->assertSame($locator, $result);
        }
    }
    
    /**
     * @covers ::buildBuilder
     * @covers ::<protected>
     */
    public function testBuildBuilder()
    {
        $this->filesystem = new \PHPixie\Filesystem();
        
        $builder = $this->filesystem->builder();
        $this->assertInstance($builder, '\PHPixie\Filesystem\Builder');
    }
}