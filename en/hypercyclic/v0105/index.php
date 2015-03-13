<?php

$new_location = "http://" . $_SERVER["SERVER_NAME"] . "/en/hypercyclic";

if(!empty($_SERVER["QUERY_STRING"]))
{
 $new_location = $new_location . "?" . $_SERVER["QUERY_STRING"];
}

header("HTTP/1.1 301 Moved Permanently");
header("Location: " .  $new_location);
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
exit();
?>
