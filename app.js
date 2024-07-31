// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYEqXt4BnW26yq-Xp_30Gaf_-RyNNOoIY",
    authDomain: "exhibition-management-sy-f455b.firebaseapp.com",
    projectId: "exhibition-management-sy-f455b",
    storageBucket: "exhibition-management-sy-f455b.appspot.com",
    messagingSenderId: "629910182359",
    appId: "1:629910182359:web:01012bf8140139a338d392",
    measurementId: "G-5K7N5DHS10"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

window.onload = function() {
    let currentUser = localStorage.getItem('currentUser');

    if (!currentUser && window.location.pathname !== '/index.html') {
        window.location.href = 'index.html';
        return;
    }

    if (currentUser === 'admin' && document.getElementById('manageUsersBtn')) {
        document.getElementById('manageUsersBtn').style.display = 'block';
    }

    if (document.getElementById('mainContent')) {
        document.getElementById('mainContent').style.display = 'block';
        fetchExhibitions();
    }

    if (document.getElementById('userListContainer')) {
        fetchUsers();
    }
};

document.getElementById('loginForm')?.addEventListener('submit', function(e) {
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

document.getElementById('exhibitionForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addExhibition();
});

document.getElementById('userForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addUser();
});

function fetchExhibitions() {
    database.ref('exhibitions').on('value', snapshot => {
        const exhibitions = snapshot.val() || {};
        updateCalendar(Object.values(exhibitions));
    });
}

function fetchUsers() {
    database.ref('users').on('value', snapshot => {
        const users = snapshot.val() || {};
        displayUsers(Object.values(users));
    });
}

function addExhibition() {
    const exhibitionName = document.getElementById('exhibitionName').value;
    const location = document.getElementById('location').value;
    const wilayat = document.getElementById('wilayat').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const exhibitionType = document.getElementById('exhibitionType').value;
    const organizingCompany = document.getElementById('organizingCompany').value;

    const newExhibition = {
        exhibitionName,
        location,
        wilayat,
        startDate,
        endDate,
        exhibitionType,
        organizingCompany,
        addedBy: localStorage.getItem('currentUser')
    };

    database.ref('exhibitions').push(newExhibition, function(error) {
        if (error) {
            document.getElementById('exhibitionError').innerText = 'حدث خطأ أثناء إضافة المعرض';
        } else {
            document.getElementById('exhibitionSuccess').innerText = 'تمت إضافة المعرض بنجاح';
            document.getElementById('exhibitionForm').reset();
            setTimeout(() => document.getElementById('exhibitionSuccess').innerText = '', 3000);
        }
    });
}

function updateCalendar(exhibitions) {
    const calendarDiv = document.getElementById('calendar');
    calendarDiv.innerHTML = '<h2>تقويم المعارض</h2>';
    const calendarEl = document.createElement('div');
    calendarEl.id = 'calendarEl';
    calendarDiv.appendChild(calendarEl);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ar',
        events: exhibitions.map(ex => ({
            title: ex.exhibitionName,
            start: ex.startDate,
            end: ex.endDate,
            extendedProps: {
                location: ex.location,
                wilayat: ex.wilayat,
                exhibitionType: ex.exhibitionType,
                organizingCompany: ex.organizingCompany,
                addedBy: ex.addedBy
            }
        })),
        eventDidMount: function(info) {
            info.el.querySelector('.fc-event-title').innerHTML +=
                `<br/>الولاية: ${info.event.extendedProps.wilayat}` +
                `<br/>الشركة المنظمة: ${info.event.extendedProps.organizingCompany}`;
        }
    });

    calendar.render();
}

function deleteExhibition(exhibitionId) {
    database.ref('exhibitions/' + exhibitionId).remove();
}

function searchExhibitions() {
    const wilayat = document.getElementById('searchWilayat').value;
    const company = document.getElementById('searchCompany').value;
    const startDate = document.getElementById('searchStartDate').value;
    const endDate = document.getElementById('searchEndDate').value;

    database.ref('exhibitions').once('value', snapshot => {
        const exhibitions = Object.values(snapshot.val() || {}).filter(ex => 
            (!wilayat || ex.wilayat === wilayat) &&
            (!company || ex.organizingCompany.includes(company)) &&
            (!startDate || new Date(ex.endDate) >= new Date(startDate)) &&
            (!endDate || new Date(ex.startDate) <= new Date(endDate))
        );

        displaySearchResults(exhibitions);
    });
}

function displaySearchResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<h2>نتائج البحث</h2>';
    results.forEach(ex => {
        resultsDiv.innerHTML += `
            <div>
                ${ex.exhibitionName} (${ex.startDate} - ${ex.endDate})
                الولاية: ${ex.wilayat}, الشركة المنظمة: ${ex.organizingCompany}, أدخل بواسطة: ${ex.addedBy}
                <button onclick="deleteExhibition('${ex.exhibitionName}')">حذف</button>
                <button onclick="generateExhibitionDocument('${ex.exhibitionName}')">توليد تصريح</button>
            </div>
        `;
    });
}

function showAllExhibitions() {
    searchExhibitions();
}

function generateReport() {
    database.ref('exhibitions').once('value', snapshot => {
        const exhibitions = snapshot.val() || {};
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(Object.values(exhibitions).map(ex => ({
            'اسم المعرض': ex.exhibitionName,
            'الموقع': ex.location,
            'الولاية': ex.wilayat,
            'تاريخ البداية': ex.startDate,
            'تاريخ النهاية': ex.endDate,
            'نوع المعرض': ex.exhibitionType,
            'الشركة المنظمة': ex.organizingCompany,
            'أضيف بواسطة': ex.addedBy
        })));
        XLSX.utils.book_append_sheet(wb, ws, "المعارض");
        XLSX.writeFile(wb, "تقرير_المعارض.xlsx");
    });
}

function generateExhibitionDocument(exhibitionName) {
    database.ref('exhibitions').orderByChild('exhibitionName').equalTo(exhibitionName).once('value', snapshot => {
        if (snapshot.exists()) {
            const exhibition = Object.values(snapshot.val())[0];
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://Tariq919.github.io/exhibition-management-system/templates/template.docx', true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = function(e) {
                if (xhr.status === 200) {
                    const template = xhr.response;
                    const zip = new PizZip(template);
                    const doc = new window.docxtemplater(zip);

                    doc.setData({
                        exhibitionName: exhibition.exhibitionName,
                        location: exhibition.location,
                        wilayat: exhibition.wilayat,
                        startDate: exhibition.startDate,
                        endDate: exhibition.endDate,
                        exhibitionType: exhibition.exhibitionType,
                        organizingCompany: exhibition.organizingCompany,
                        addedBy: exhibition.addedBy
                    });

                    try {
                        doc.render();
                    } catch (error) {
                        console.error(error);
                        alert('حدث خطأ أثناء توليد التصريح: ' + error.message);
                        return;
                    }

                    const out = doc.getZip().generate({
                        type: 'blob',
                        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    });

                    saveAs(out, `تصريح_${exhibition.exhibitionName}.docx`);
                } else {
                    alert('تعذر تحميل قالب التصريح. الرجاء التحقق من الرابط.');
                }
            };

            xhr.onerror = function() {
                alert('تعذر الاتصال بالخادم لتحميل القالب.');
            };

            xhr.send();
        } else {
            alert('المعرض غير موجود');
        }
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

function navigateToUserManagement() {
    window.location.href = 'user_management.html';
}
