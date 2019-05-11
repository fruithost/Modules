<?php

namespace PHPixie\Tests\Filesystem\Locators\Locator;

/**
 * @coversDefaultClass \PHPixie\Filesystem\Locators\Locator\Group
 */
class GroupTest extends \PHPixie\Test\Testcase
{
    protected $locatorBuilder;
    protected $locatorsConfig;
    
    protected $locator;
    
    public function setUp()
    {
        $configData = $this->getData();
        $this->locatorBuilder = $this->quickMock('\PHPixie\Filesystem\Locators\Builder');
        
        $this->locatorsConfig = $this->getData();
        $this->method($configData, 'slice', $this->locatorsConfig, array('locators'), 0);
    
        $this->locator = new \PHPixie\Filesystem\Locators\Locator\Group(
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
     * @covers ::locate
     * @covers ::<protected>
     */
    public function testLocate()
    {
        $locators = $this->prepareLocators();
        
        foreach(array(false) as $isDirectory) {
            foreach(array('pixie', null) as $path) {
                foreach($locators as $key => $locator) {
                    $locatorPath = $key == 1 ? $path : null;
                    $this->method($locator, 'locate', $locatorPath, array('fairy', $isDirectory), 0);
                }
                
                $params = array('fairy');
                if($isDirectory) {
                    $params[]= true;
                }
                
                $result = call_user_func_array(array($this->locator, 'locate'), $params);
                $this->assertSame($path, $result);
            }
        }
    }
    
    
    protected function prepareLocators()
    {
        $this->method($this->locatorsConfig, 'keys', array(0, 1), array(null, true), 0);
        
        $locators = array();
        
        for($i=0; $i<2; $i++) {
            $locatorConfig = $this->getData();
            $locator = $this->abstractMock('\PHPixie\Filesystem\Locators\Locator');
            
            $this->method($this->locatorsConfig, 'slice', $locatorConfig, array($i), $i+1);
            $this->method($this->locatorBuilder, 'buildFromConfig', $locator, array($locatorConfig), $i);
            
            $locators[] = $locator;
        }
        
        return $locators;
    }
    
    protected function getData()
    {
        return $this->abstractMock('\PHPixie\Slice\Data');
    }
}