<?php
$exhibitions = json_decode(file_get_contents('exhibitions.txt'), true);
echo json_encode($exhibitions);
?>
