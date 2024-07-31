window.onload = function() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        database.ref('users').orderByChild('username').equalTo(username).once('value', snapshot => {
            if (snapshot.exists()) {
                const userData = Object.values(snapshot.val())[0];
                if (userData.password === password) {
                    localStorage.setItem('currentUser', username);
                    window.location.href = 'main.html';
                } else {
                    document.getElementById('loginError').innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                }
            } else {
                document.getElementById('loginError').innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة';
            }
        });
    });

    // إضافة مستخدم افتراضي عند تحميل الصفحة لأول مرة
    database.ref('users').once('value', snapshot => {
        if (!snapshot.exists()) {
            const defaultUser = {
                username: 'admin',
                password: 'admin123'
            };
            database.ref('users').push(defaultUser);
        }
    });
};
