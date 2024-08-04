<?php
$data = json_decode(file_get_contents('php://input'), true);

$users = json_decode(file_get_contents('users.txt'), true);
$users[] = $data;
file_put_contents('users.txt', json_encode($users));

echo json_encode(['success' => true]);
?>
