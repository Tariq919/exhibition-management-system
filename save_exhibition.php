<?php
$data = json_decode(file_get_contents('php://input'), true);

$exhibitions = json_decode(file_get_contents('exhibitions.txt'), true);
$exhibitions[] = $data;
file_put_contents('exhibitions.txt', json_encode($exhibitions));

echo json_encode(['success' => true]);
?>
