<?php

namespace PHPixie\Tests\Filesystem\Locators\Locator;

/**
 * @coversDefaultClass \PHPixie\Filesystem\Locators\Locator\Mount
 */
class MountTest extends \PHPixie\Test\Testcase
{
    protected $locatorRegistry;
    protected $configData;
    
    protected $locator;
    
    protected $name = 'pixie';
    protected $subLocator;
    
    public function setUp()
    {
        $this->locatorRegistry = $this->quickMock('\PHPixie\Filesystem\Locators\Registry');
        $this->configData = $this->quickMock('\PHPixie\Slice\Data');
        
        $this->locator = new \PHPixie\Filesystem\Locators\Locator\Mount(
            $this->locatorRegistry,
            $this->configData
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
        $locator = $this->prepareLocator();
        
        $this->method($locator, 'locate', 'trixie.php', array('pixie', false), 0);
        $this->assertSame('trixie.php', $this->locator->locate('pixie'));
        
        $this->method($locator, 'locate', 'trixie.php', array('pixie', true), 0);
        $this->assertSame('trixie.php', $this->locator->locate('pixie', true));
    }
    
    protected function prepareLocator()
    {
        $this->method($this->configData, 'getRequired', $this->name, array('name'), 0);
        
        $locator = $this->quickMock('\PHPixie\Filesystem\Locators\Locator');
        $this->method($this->locatorRegistry, 'get', $locator, array($this->name), 0);
        
        return $locator;
    }
}