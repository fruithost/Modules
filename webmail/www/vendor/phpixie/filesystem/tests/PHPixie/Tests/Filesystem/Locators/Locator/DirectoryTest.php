<?php

namespace PHPixie\Tests\Filesystem\Locators\Locator;

/**
 * @coversDefaultClass \PHPixie\Filesystem\Locators\Locator\Directory
 */
class DirectoryTest extends \PHPixie\Test\Testcase
{
    protected $root;
    protected $configData;
    
    protected $locator;
    
    protected $rootDirectory;
    protected $directory = '/phpixie_template/';
    protected $fullDirectory;
    
    protected $defaultExtension = 'php';
    
    public function setUp()
    {
        $this->rootDirectory = sys_get_temp_dir();
        $this->fullDirectory = $this->rootDirectory.$this->directory;
        
        $this->root = $this->abstractMock('\PHPixie\Filesystem\Root');
        $rootDirectory = $this->rootDirectory;
        $this->method($this->root, 'path', function($path) use($rootDirectory){
            return preg_replace('#/+#', '/', $rootDirectory.$path);
        });
        
        $this->configData = $this->abstractMock('\PHPixie\Slice\Data');
        $this->method($this->configData, 'getRequired', $this->directory, array('directory'), 0);
        $this->method($this->configData, 'get', $this->defaultExtension, array('defaultExtension', 'php'), 1);
        
        $this->removeDirectory();
        
        mkdir($this->fullDirectory);
        
        $this->locator = new \PHPixie\Filesystem\Locators\Locator\Directory(
            $this->root,
            $this->configData
        );
    }
    
    public function tearDown()
    {
        $this->removeDirectory();
    }
    
    public function removeDirectory()
    {
        if(!is_dir($this->fullDirectory)) {
            return;
        }
        
        foreach(scandir($this->fullDirectory) as $file) {
            $file = $this->fullDirectory.'/'.$file;
            if(is_file($file) && file_exists($file)) {
                unlink($file);
            }
        }
        
        rmdir($this->fullDirectory);
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
        $file = $this->fullDirectory.'fairy.php';
        file_put_contents($file, '');
        
        $this->assertSame($file, $this->locator->locate('fairy'));
        
        $file = $this->fullDirectory.'fairy.haml';
        file_put_contents($file, '');
        
        $this->assertSame($file, $this->locator->locate('fairy.haml'));
        $this->assertSame(null, $this->locator->locate('pixie.haml'));
        
        $this->assertSame(null, $this->locator->locate('fairy.haml', true));
        $this->assertSame($this->fullDirectory, $this->locator->locate('/', true));
    }
}