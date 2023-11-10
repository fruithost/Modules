<?php

namespace PHPixie\Tests\Filesystem;

/**
 * @coversDefaultClass \PHPixie\Filesystem\Root
 */
class RootTest extends \PHPixie\Test\Testcase
{
    protected $path = '/pixie';
    protected $root;
    
    public function setUp()
    {
        $this->root = new \PHPixie\Filesystem\Root($this->path);
    }
    
    /**
     * @covers ::__construct
     * @covers ::<protected>
     */
    public function testConstruct()
    {
        $this->assertSame('/pixie/', $this->root->path());
        
        $this->root = new \PHPixie\Filesystem\Root('/pixie/');
        $this->assertSame('/pixie/', $this->root->path());
    }
    
    /**
     * @covers ::path
     * @covers ::<protected>
     */
    public function testPath()
    {
        $this->assertSame('/pixie/', $this->root->path());
        $this->assertSame('/pixie/trixie', $this->root->path('trixie'));
    }
}