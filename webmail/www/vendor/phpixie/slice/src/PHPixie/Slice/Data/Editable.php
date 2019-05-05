<?php

namespace PHPixie\Slice\Data;

interface Editable extends \PHPixie\Slice\Data
{
    public function remove($path = null);
    public function set($path = null, $value);
    public function slice($path = null);
}
