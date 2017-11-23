<?php

    /**
     * @description Respond with json from all the files in the json directory.
     * without a session this will not be honored.
     * 
     */
    //session_start();
    
    $sanitizer;
    $top;
    $folder;
    $subfoler;
    $basename;
    $ext;
    $filename;
    $response;
    $root;

    require_once "../c/Sanitizer.php";  
    require_once "../f/paththings.php";    
        
    //if ($_SESSION["userInfo"]["Id"] === $_COOKIE["Id"]) {  
        $sanitizer = new \CJControl\Sanitizer();
        $root = getDocRootPath();
        $top = $sanitizer->run($_GET["t"], "string");        
        $folder = $sanitizer->run($_GET["f"], "string");
        $subfolder = $sanitizer->run($_GET["sf"], "string");
        $basename = $sanitizer->run($_GET["b"], "string");
        $ext = $sanitizer->run($_GET["ext"], "string");
        $filename = $root . "/". $top."/". $folder."/". $subfolder."/". $basename . ".$ext";
        $response = file_exists($filename)? file_get_contents($filename): json_encode(array());
        header("Cache Control: must-revalidate max-age=60");
        echo $response;
    //}
