<?php

namespace PHPixie\Tests\Filesystem\Locators;

/**
 * @coversDefaultClass \PHPixie\Filesystem\Locators\Builder
 */
class BuilderTest extends \PHPixie\Test\Testcase
{
    protected $locators;
    protected $root;
    protected $locatorRegistry;
    
    protected $builder;
    
    public function setUp()
    {
        $this->locators        = $this->quickMock('\PHPixie\Filesystem\Locators');
        $this->root            = $this->quickMock('\PHPixie\Filesystem\Root');
        $this->locatorRegistry = $this->quickMock('\PHPixie\Filesystem\Locators\Registry');
        
        $this->builder = new \PHPixie\Filesystem\Locators\Builder(
            $this->locators,
            $this->root,
            $this->locatorRegistry
        );
    }
    
    /**
     * @covers ::__construct
     * @covers ::<protected>
     */
    public function testConstruct()
    {
        
    }
    
    /**
     * @covers ::buildFromConfig
     * @covers ::<protected>
     */
    public function testBuildFromConfig()
    {
        $configData = $this->abstractMock('\PHPixie\Slice\Data');
        
        $types = array(
            'directory' => array($this->root, $configData),
            'group'     => array($this->builder, $configData),
            'mount'     => array($this->locatorRegistry, $configData),
            'prefix'    => array($this->builder, $configData),
        );
        
        foreach($types as $type => $parameters) {
            $this->method($configData, 'get', $type, array('type', 'directory'), 0);
            
            $locator = $this->quickMock('\PHPixie\Filesystem\Locators\Locator');
            $this->method($this->locators, $type, $locator, $parameters, 0);
            
            $this->assertSame($locator, $this->builder->buildFromConfig($configData));
        }
        
        $builder = new \PHPixie\Filesystem\Locators\Builder(
            $this->locators,
            $this->root
        );
        
        $this->method($configData, 'get', 'mount', array('type', 'directory'), 0);
        
        $this->assertException(function() use($builder, $configData) {
            $builder->buildFromConfig($configData);
        }, '\PHPixie\Filesystem\Exception');
        
    }
}