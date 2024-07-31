window.onload = function() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log("Attempting to login with username:", username);

        database.ref('users').orderByChild('username').equalTo(username).once('value', snapshot => {
            if (snapshot.exists()) {
                const userData = Object.values(snapshot.val())[0];
                if (userData.password === password) {
                    console.log("Login successful");
                    localStorage.setItem('currentUser', username);
                    window.location.href = 'main.html';
                } else {
                    console.log("Incorrect password");
                    document.getElementById('loginError').innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة';
                }
            } else {
                console.log("Username not found");
                document.getElementById('loginError').innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة';
            }
        });
    });

    // إضافة مستخدم افتراضي عند تحميل الصفحة لأول مرة
    database.ref('users').once('value', snapshot => {
        if (!snapshot.exists()) {
            console.log("Creating default user");
            const defaultUser = {
                username: 'admin',
                password: 'admin123'
            };
            database.ref('users').push(defaultUser);
        }
    });
};
