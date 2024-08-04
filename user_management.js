document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('save_user.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('userSuccess').innerText = 'تمت إضافة المستخدم بنجاح';
            document.getElementById('userForm').reset();
            fetchUsers();
        } else {
            document.getElementById('userError').innerText = 'حدث خطأ أثناء إضافة المستخدم';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

function fetchUsers() {
    fetch('get_users.php')
    .then(response => response.json())
    .then(data => {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        data.forEach(user => {
            const userItem = document.createElement('div');
            userItem.innerHTML = `
                <p>اسم المستخدم: ${user.username}</p>
            `;
            userList.appendChild(userItem);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

fetchUsers();
