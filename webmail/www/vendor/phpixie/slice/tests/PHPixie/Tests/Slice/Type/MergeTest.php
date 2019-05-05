<?php

namespace PHPixie\Tests\Slice\Type;

/**
 * @coversDefaultClass \PHPixie\Slice\Type\Merge
 */
class MergeTest extends \PHPixie\Tests\Slice\Data\ImplementationTest
{
    protected $base;
    protected $override;

    protected $data = array(
        'meadows' => 5,
        'meadow' => array(
            'grass_type' => 6,
            'fairies' => array(
                'names' => array('Tinkerbell')
            ),
            'trees' => array(
                'oak' => array(
                    'fairy' => array('Trixie')
                )
            )
        ),
        'lake' => array(
            'mermaids' => array(
                'names' => array('Naiad')
            )
        )
    );

    protected $baseData = array(
        'meadows' => 4,
        'meadow' => array(
            'grass_type' => 6,
            'fairies' => array(
                'names' => array('Tinkerbell')
            ),
            'trees' => array(
                'oak' => array(
                    'fairy' => array('Trixie')
                )
            )
        ),
        'lake' => array(
            'mermaids' => array(

            )
        )
    );

    protected $overrideData = array(
        'meadows' => 5,
        'lake' => array(
            'mermaids' => array(
                'names' => array('Naiad')
            )
        )
    );

    public function setUp()
    {
        $this->base = new \PHPixie\Slice\Type\ArrayData($this->sliceBuilder, $this->baseData);
        $this->override = new \PHPixie\Slice\Type\ArrayData($this->sliceBuilder, $this->overrideData);

        parent::setUp();
    }

    /**
     * @covers ::keys
     * @covers ::<protected>
     */
    public function testKeys()
    {
        $this->assertSame(array('meadows', 'meadow', 'lake'), $this->sliceData->keys());
        $this->assertSame(array('names'), $this->sliceData->keys('meadow.fairies'));
        $this->assertSame(array(), $this->sliceData->keys('meadow.fairies.pixie'));

        $sliceData = $this->sliceData;
        $this->assertSliceException(function () use($sliceData) {
            $sliceData->keys('meadow.fairies.pixie', true);
        });
    }

    /**
     * @covers ::arraySlice
     * @covers ::<protected>
     */
    public function testArraySlice()
    {
        $this->arraySliceTest();
    }

    /**
     * @covers ::slice
     * @covers ::<protected>
     */
    public function testSlice()
    {
        $this->arraySliceTest('slice');
    }

    protected function arraySliceTest($method = 'arraySlice')
    {
        $slice = $this->getArraySlice();
        $this->method($this->sliceBuilder, 'arraySlice', $slice, array($this->data['meadow'], 'meadow'), 0);
        $this->assertSame($slice, $this->sliceData->$method('meadow'));

        $slice = $this->getArraySlice();
        $this->method($this->sliceBuilder, 'arraySlice', $slice, array($this->data, null), 0);
        $this->assertSame($slice, $this->sliceData->$method());
    }

    protected function prepareGetDataSets()
    {
        $sets = array();

        $sets[] = array('get', array(), $this->data);
        $sets[] = array('get', array('meadows'), 5);
        $sets[] = array('getRequired', array('meadow.grass_type'), 6);

        $sets[] = array('getRequired', array('lake.mermaids'), array('names' => array('Naiad')));
        $sets[] = array('get', array('meadow'), array(
            'grass_type' => 6,
            'fairies' => array(
                'names' => array('Tinkerbell')
            ),
            'trees' => array(
                'oak' => array(
                    'fairy' => array('Trixie')
                )
            )
        ));

        $sets[] = array('get', array('meadow.trees.oak.fairy.0'), 'Trixie');

        $sets[] = array('get', array('meadow.grass_type.pixies', 'test'), 'test');
        $sets[] = array('getRequired', array('meadow.grass_type.pixies'), 'exception');
        $sets[] = array('getRequired', array('meadow.grass_type.pixies.name'), 'exception');

        return $sets;
    }

    /**
     * @covers ::getIterator
     * @covers ::<protected>
     */
    public function testIterator()
    {
        $iterator = $this->sliceData->getIterator();
        $this->assertInstance($iterator, '\ArrayIterator');
        $this->assertSame($this->data, $iterator->getArrayCopy());
    }

    protected function sliceData()
    {
        return new \PHPixie\Slice\Type\Merge(
            $this->sliceBuilder,
            $this->base,
            $this->override
        );
    }
}
