<?php

namespace PHPixie\Filesystem\Locators;

interface Registry
{
    public function get($name);
}