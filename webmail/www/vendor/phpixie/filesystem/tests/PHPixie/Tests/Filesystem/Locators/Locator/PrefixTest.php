<?php

namespace PHPixie\Tests\Filesystem\Locators\Locator;

/**
 * @coversDefaultClass \PHPixie\Filesystem\Locators\Locator\Prefix
 */
class PrefixTest extends \PHPixie\Test\Testcase
{
    protected $locatorBuilder;
    protected $locatorsConfig;
    protected $defaultPrefix = 'first';
    
    protected $locator;
    
    public function setUp()
    {
        
        $this->locatorBuilder = $this->quickMock('\PHPixie\Filesystem\Locators\Builder');
        
        $configData = $this->getData();
        
        $this->locatorsConfig = $this->getData();
        $this->method($configData, 'slice', $this->locatorsConfig, array('locators'), 0);
        $this->method($configData, 'get', $this->defaultPrefix, array('defaultPrefix', 'default'), 1);
        
        $this->locator = new \PHPixie\Filesystem\Locators\Locator\Prefix(
            $this->locatorBuilder,
            $configData
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
     * @covers ::get
     * @covers ::<protected>
     */
    public function testGet()
    {
        $locator = $this->prepareLocator('second');
        
        for($i=0; $i<2; $i++) {
            $this->assertSame($locator, $this->locator->get('second', true));
        }
    }
    
    /**
     * @covers ::locate
     * @covers ::<protected>
     */
    public function testLocate()
    {
        $locator = $this->prepareLocator('second');
        
        $this->method($locator, 'locate', 'pixie', array('fairy', false), 0);
        $this->assertSame('pixie', $this->locator->locate('second:fairy'));
        
        $this->method($locator, 'locate', 'pixie', array('fairy', true), 0);
        $this->assertSame('pixie', $this->locator->locate('second:fairy', true));
        
        $locator = $this->prepareLocator('first');
        
        $this->method($locator, 'locate', 'pixie', array('fairy'), 0);
        $this->assertSame('pixie', $this->locator->locate('fairy'));
    }
    
    protected function prepareLocator($name)
    {
        $locator = $this->abstractMock('\PHPixie\Filesystem\Locators\Locator');
        
        $locatorConfig = $this->getData();
        $this->method($this->locatorsConfig, 'get', array($name => array()), array(), 0);
        $this->method($this->locatorsConfig, 'slice', $locatorConfig, array($name), 1);
        $this->method($this->locatorBuilder, 'buildFromConfig', $locator, array($locatorConfig), 0);
        
        return $locator;
    }
    
    protected function getData()
    {
        return $this->abstractMock('\PHPixie\Slice\Data');
    }
}