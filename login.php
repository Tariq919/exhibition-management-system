<?php
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'];
$password = $data['password'];

$users = json_decode(file_get_contents('users.txt'), true);
$found = false;

foreach ($users as $user) {
    if ($user['username'] === $username && $user['password'] === $password) {
        $found = true;
        break;
    }
}

if ($found) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false]);
}
?>
