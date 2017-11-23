<?php
/*
 * Collection of functions that do file & folder things.
 */

/**
 * @description Return a list of files found in a directory.
 * @param String $dir
 * @return Array 
 */
function globFiles ($dir)
{
    $filenames = array();
    foreach(glob($dir) as $file) {
        if (!is_dir($file)) {
            // file e.g models.json
            array_push($filenames, basename($file));
        }
    }
    return json_encode($filenames);
}
/**
 * @description Return json object whose properties are contents of the files in the directory.
 * @param type $dir
 * @return type
 */
function globFetch ($dir)
{
    $filecontents = array();
    $filename;
    $content;
    foreach(glob($dir) as $file) {
        if (!is_dir($file)) {
            // file e.g models.json
            $filename = basename($file, ".json");
            //echo $filename . "<br>";
            $content = file_get_contents($file);
            $filecontents[$filename] = $content;
        }
    }
    return json_encode($filecontents);
}

/**
 * 
 * @param String $path
 * @return type
 */
function globIntegerVersions ($dir)
{
    // glob files in directory,
    // return only distinct basenamed files with the highest version of their basename.    
    $basename = "";
    $filenames = array();
    $distinct = array();
    foreach(glob($dir) as $filename) {
        if (!is_dir($filename)) {
            $filename = basename($filename);
            // filename e.g models.json
            $basename = basename($filename, $ext);
            // strikeout the _version suffix;
            // e.g file_1.js becomes file
            //$basename = preg_replace(//$basename, $distinct, $filenames)
            //array_push($filenames, $basename);
        }
        // select distinct basenames only
        $distinct = array_unique($filenames);
    }
    return json_encode($filenames);
}