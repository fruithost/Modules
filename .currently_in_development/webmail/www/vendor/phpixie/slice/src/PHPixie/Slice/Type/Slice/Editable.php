<?php

namespace PHPixie\Slice\Type\Slice;

class Editable extends    \PHPixie\Slice\Type\Slice
               implements \PHPixie\Slice\Data\Slice\Editable
{
    public function set($path, $value)
    {
        $this->data->set($this->dataPath($path), $value);
    }

    public function remove($path = null)
    {
        $this->data->remove($this->dataPath($path));
    }
}
