document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('currentUser', username);
            window.location.href = 'main.html';
        } else {
            document.getElementById('loginError').innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
