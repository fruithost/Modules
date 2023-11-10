<?php

namespace PHPixie\Tests\Filesystem;

/**
 * @coversDefaultClass \PHPixie\Filesystem\Locators
 */
class LocatorsTest extends \PHPixie\Test\Testcase
{
    protected $builder;
    
    protected $locators;
    
    public function setUp()
    {
        $this->builder          = $this->quickMock('\PHPixie\Filesystem\Builder');
        $this->locatorRegistry  = $this->quickMock('\PHPixie\Filesystem\Locators\Registry');
        
        $this->locators = new \PHPixie\Filesystem\Locators(
            $this->builder,
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
     * @covers ::directory
     * @covers ::<protected>
     */
    public function testDirectory()
    {
        $root = $this->quickMock('\PHPixie\Filesystem\Root');
        $configData = $this->getData();
        
        $this->method($configData, 'getRequired', '/fairy', array('directory'), 0);
        $this->method($configData, 'get', 'js', array('defaultExtension', 'php'), 1);
        
        $locator = $this->locators->directory($root, $configData);
        $this->assertInstance($locator, '\PHPixie\Filesystem\Locators\Locator\Directory', array(
            'root'             => $root,
            'directory'        => '/fairy',
            'defaultExtension' => 'js'
        ));
    }
    
    /**
     * @covers ::group
     * @covers ::<protected>
     */
    public function testGroup()
    {
        $locatorBuilder = $this->getLocatorBuilder();
        $configData     = $this->getData();
        
        $locatorsConfig = $this->getData();
        $this->method($configData, 'slice', $locatorsConfig, array('locators'), 0);
        
        $locator = $this->locators->group($locatorBuilder, $configData);
        $this->assertInstance($locator, '\PHPixie\Filesystem\Locators\Locator\Group', array(
            'locatorBuilder' => $locatorBuilder,
            'locatorsConfig' => $locatorsConfig
        ));
    }
    
    /**
     * @covers ::prefix
     * @covers ::<protected>
     */
    public function testPrefix()
    {
        $locatorBuilder = $this->getLocatorBuilder();
        $configData     = $this->getData();
        
        $locatorsConfig = $this->getData();
        $this->method($configData, 'slice', $locatorsConfig, array('locators'), 0);
        $this->method($configData, 'get', 'pixie', array('defaultPrefix', 'default'), 1);
        
        $locator = $this->locators->prefix($locatorBuilder, $configData);
        $this->assertInstance($locator, '\PHPixie\Filesystem\Locators\Locator\Prefix', array(
            'locatorBuilder' => $locatorBuilder,
            'locatorsConfig' => $locatorsConfig,
            'defaultPrefix'  => 'pixie'
        ));
    }
    
    /**
     * @covers ::mount
     * @covers ::<protected>
     */
    public function testMount()
    {
        $locatorRegistry = $this->quickMock('\PHPixie\Filesystem\Locators\Registry');
        $configData = $this->getData();

        $locator = $this->locators->mount($locatorRegistry, $configData);
        $this->assertInstance($locator, '\PHPixie\Filesystem\Locators\Locator\Mount', array(
            'locatorRegistry' => $locatorRegistry,
            'configData'      => $configData
        ));
    }
    
    /**
     * @covers ::builder
     * @covers ::<protected>
     */
    public function testBuilder()
    {
        $root            = $this->quickMock('\PHPixie\Filesystem\Root');
        $locatorRegistry = $this->quickMock('\PHPixie\Filesystem\Locators\Registry');

        $builder = $this->locators->builder($root, $locatorRegistry);
        $this->assertInstance($builder, '\PHPixie\Filesystem\Locators\Builder', array(
            'root'            => $root,
            'locatorRegistry' => $locatorRegistry
        ));
        
        $builder = $this->locators->builder($root);
        $this->assertInstance($builder, '\PHPixie\Filesystem\Locators\Builder', array(
            'root'            => $root,
            'locatorRegistry' => null
        ));
    }
    
    protected function getLocatorBuilder()
    {
        return $this->quickMock('\PHPixie\Filesystem\Locators\Builder');
    }
    
    protected function getData()
    {
        return $this->quickMock('\PHPixie\Slice\Data');
    }
}