<?php

    /**
     * @description Respond with json from all the files in the json directory.
     * without a session this will not be honored.
     */
    //session_start();
    
    $def;
    require_once "../src/models/Definition.php";
    //if ($_SESSION["userInfo"]["Id"] === $_COOKIE["Id"]) {    
        $def = new \CJModel\Definition();
        echo $def->manifest;        
    //}
