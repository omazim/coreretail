<?php

    /**
     * @description Respond with file requested.
     * @param Array $comp array of GET params.
     */
    //session_start();
    
    $sanitizer;
    $response;
    $root;

    require_once "../c/Sanitizer.php";
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
        $dir = $root . "/" . implode("/", $comps);
        echo $dir;
    //}
