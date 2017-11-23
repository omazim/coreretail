<?php

    /**
     * @description Respond with json.
     * could contents of a file, files in a folder or data from a database read.
     * without a session this will not be honored.
     * @param Array $comp array of GET params.
     * @param Number $action indicates which action fetcher should do:
     *  1. return names of files in the specified directory.
     *  2. return contents of specified file.
     *  3. return data from database.
     */
    //session_start();
    
    $sanitizer;
    $response;
    $root;

    require_once "../c/Sanitizer.php";
    require_once "../f/filethings.php";    
    require_once "../f/paththings.php";    
        
    //if ($_SESSION["userInfo"]["Id"] === $_COOKIE["Id"]) {
        header("Cache Control: no-store");
        $sanitizer = new \CJControl\Sanitizer();
        $root = getDocRootPath();
        $comps = array();
        $dir;
        foreach ($_GET as $comp) {
            array_push($comps, $sanitizer->run($comp, "string"));
        }
        $dir = $root . "/" . implode("/", $comps) . "/*";
        $response = globFetch($dir);
        echo $response;
    //}
    // todo: consider using a completely different directory pathway to resolve the needed directory
        // so that web/coreretail/js could be js/coreretail
