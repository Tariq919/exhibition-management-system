window.onload = function() {
    fetchUsers();

    document.getElementById('userForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addUser();
    });
};

function fetchUsers() {
    database.ref('users').on('value', snapshot => {
        const users = snapshot.val() || {};
        displayUsers(Object.values(users));
    });
}

function addUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    database.ref('users').orderByChild('username').equalTo(username).once('value', snapshot => {
        if (snapshot.exists()) {
            document.getElementById('userError').innerText = 'اسم المستخدم موجود بالفعل.';
        } else {
            const newUser = {
                username,
                password
            };

            database.ref('users').push(newUser, function(error) {
                if (error) {
                    document.getElementById('userError').innerText = 'حدث خطأ أثناء إضافة المستخدم';
                } else {
                    document.getElementById('userSuccess').innerText = 'تمت إضافة المستخدم بنجاح';
                    document.getElementById('userForm').reset();
                    setTimeout(() => document.getElementById('userSuccess').innerText = '', 3000);
                }
            });
        }
    });
}

function deleteUser(userId) {
    database.ref('users/' + userId).remove();
}

function displayUsers(users) {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    users.forEach(user => {
        userList.innerHTML += `
            <div>
                اسم المستخدم: ${user.username}
                <button onclick="deleteUser('${user.id}')">حذف</button>
            </div>
        `;
    });
}
