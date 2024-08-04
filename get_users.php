<?php
$users = json_decode(file_get_contents('users.txt'), true);
echo json_encode($users);
?>
