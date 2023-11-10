<?php

namespace PHPixie\Filesystem;

class Actions
{
    public function createDirectory($path)
    {
        mkdir($path, 0755);
    }
    
    public function symlink($src, $dst)
    {
        symlink($src, $dst);
    }
    
    public function move($src, $dst)
    {
        rename($src, $dst);
    }
    
    public function copy($src, $dst)
    {
        $this->createDirectory($dst);
        
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(
                $src,
                \RecursiveDirectoryIterator::SKIP_DOTS
            ),
            \RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach($iterator as $item) {
            if (!$item->isLink() && $item->isDir()) {
                mkdir($dst.'/'.$iterator->getSubPathName());
                continue;
            }
            
            copy($item, $dst.'/'.$iterator->getSubPathName());
        }
    }
    
    public function remove($path)
    {
        if(!file_exists($path)) {
            return;
        }
        
        if(is_file($path)) {
            unlink($path);
            return;
        }
        
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(
                $path,
                \RecursiveDirectoryIterator::SKIP_DOTS
            ),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        
        foreach ($iterator as $item) {
            if (!$item->isLink() && $item->isDir()) {
                rmdir($item);
            } else {
                unlink($item);
            }
        }
        
        rmdir($path);
    }
}
