<?php
    function initDefs () {        
        $GLOBALS["def"] = array();

        $dir = getModelsPath() . "/json/*.json";
        $str = "";
        $modelname = "";// equivalent to Core Retail model table names.
        // refer to Core Retail documentation (Model Definitions).
        $filename = "";        
        $filetitle = "";        
        foreach(glob($dir) as $file) {
            if(!is_dir($file)) {
                $filetitle = basename($file);
                $str = file_get_contents($file);
                $json = json_decode($str, true);
                $filename = basename($filetitle, ".json");
                $modelname = $filename;
                $GLOBALS["def"][$modelname] = $json;
                //echo "<pre>" . $filetitle . " = " . print_r($json, true) . ";</pre>";
            }
        }
    }
    function getDocRootPath () { 
        $sanitizer = new \CJControl\Sanitizer();
        $root = $sanitizer->run($_SERVER["DOCUMENT_ROOT"], "string");
        return $root . "/africanstorefronts";       
    }
    function getTemplatesPath ($root) {
        return $root . "/src/v/html_templates";       
    }
    function getHTMLPath () {
        return $root . "/web/html";       
    }
    function getModelsPath () {
        // path containing model scripts & classes
        return $_SERVER["DOCUMENT_ROOT"] . "/readmedia/src/m";
    }
    function getViewsPath () {
        // path containing view scripts & classes path
        return $_SERVER["DOCUMENT_ROOT"] . "/readmedia/src/v";        
    }
    function getControlsPath () {
        // path containing controller scripts & classes path
        return $_SERVER["DOCUMENT_ROOT"] . "/readmedia/src/c";        
    }
    function getMyIncludePath () {
        return get_include_path();
    }
    /**
    * @return bool
    */
    function hasSession() {
        if (php_sapi_name() !== 'cli' ) {
            if ( version_compare(phpversion(), '5.4.0', '>=') ) {
                return session_status() === PHP_SESSION_ACTIVE ? TRUE : FALSE;
            } else {
                return session_id() === '' ? FALSE : TRUE;
            }
        }
        return FALSE;
    }
    function objectifyTable () {
        
    }
    /*spl_autoload_register(function($class) {

    $filename = __DIR__ . '\\' . $class . '.php';

    if(!file_exists($filename)) {
        return false; // End autoloader function and skip to the next if available.
    }

    include $filename;
    return true; // End autoloader successfully.

});*/
