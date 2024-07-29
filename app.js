let exhibitions = JSON.parse(localStorage.getItem('exhibitions')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = localStorage.getItem('currentUser');

window.onload = function() {
    if (!currentUser && window.location.pathname !== '/index.html') {
        window.location.href = 'index.html';
        return;
    }

    if (currentUser === 'admin' && document.getElementById('manageUsersBtn')) {
        document.getElementById('manageUsersBtn').style.display = 'block';
    }

    if (document.getElementById('mainContent')) {
        document.getElementById('mainContent').style.display = 'block';
        updateCalendar();
    }

    if (document.getElementById('userListContainer')) {
        displayUsers();
    }
};

document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        localStorage.setItem('currentUser', username);
        window.location.href = 'main.html';
    } else {
        document.getElementById('loginError').innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة';
    }
});

document.getElementById('exhibitionForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addExhibition();
});

document.getElementById('userForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addUser();
});

function saveExhibitions() {
    localStorage.setItem('exhibitions', JSON.stringify(exhibitions));
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function addExhibition() {
    const exhibitionName = document.getElementById('exhibitionName').value;
    const location = document.getElementById('location').value;
    const wilayat = document.getElementById('wilayat').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const exhibitionType = document.getElementById('exhibitionType').value;
    const organizingCompany = document.getElementById('organizingCompany').value;

    const conflictingExhibition = exhibitions.find(ex => 
        ex.wilayat === wilayat && 
        ex.exhibitionType === exhibitionType && 
        ((new Date(startDate) >= new Date(ex.startDate) && new Date(startDate) <= new Date(ex.endDate)) ||
         (new Date(endDate) >= new Date(ex.startDate) && new Date(endDate) <= new Date(ex.endDate)))
    );

    if (conflictingExhibition) {
        document.getElementById('exhibitionError').innerText = `تنبيه: يوجد معرض مماثل في نفس الولاية ونفس الفترة ونفس النوع. اسم المعرض الموجود: ${conflictingExhibition.exhibitionName}`;
        return;
    }

    const newExhibition = {
        exhibitionName,
        location,
        wilayat,
        startDate,
        endDate,
        exhibitionType,
        organizingCompany,
        addedBy: currentUser
    };

    exhibitions.push(newExhibition);
    saveExhibitions();
    updateCalendar();
    document.getElementById('exhibitionForm').reset();
    document.getElementById('exhibitionError').innerText = '';
    document.getElementById('exhibitionSuccess').innerText = 'تمت إضافة المعرض بنجاح';
}

function updateCalendar() {
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

function deleteExhibition(exhibitionName) {
    exhibitions = exhibitions.filter(ex => ex.exhibitionName !== exhibitionName);
    saveExhibitions();
    updateCalendar();
}

function searchExhibitions() {
    const wilayat = document.getElementById('searchWilayat').value;
    const company = document.getElementById('searchCompany').value;
    const startDate = document.getElementById('searchStartDate').value;
    const endDate = document.getElementById('searchEndDate').value;

    const results = exhibitions.filter(ex => 
        (!wilayat || ex.wilayat === wilayat) &&
        (!company || ex.organizingCompany.includes(company)) &&
        (!startDate || new Date(ex.endDate) >= new Date(startDate)) &&
        (!endDate || new Date(ex.startDate) <= new Date(endDate))
    );

    displaySearchResults(results);
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
    displaySearchResults(exhibitions);
}

function generateReport() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exhibitions.map(ex => ({
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
}

function generateExhibitionDocument(exhibitionName) {
    const exhibition = exhibitions.find(ex => ex.exhibitionName === exhibitionName);
    if (!exhibition) {
        alert('المعرض غير موجود');
        return;
    }

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
}

function addUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        document.getElementById('userError').innerText = 'اسم المستخدم موجود بالفعل.';
        return;
    }

    const newUser = {
        username,
        password
    };

    users.push(newUser);
    saveUsers();
    displayUsers();
    document.getElementById('userForm').reset();
    document.getElementById('userError').innerText = '';
    document.getElementById('userSuccess').innerText = 'تمت إضافة المستخدم بنجاح';
}

function deleteUser(username) {
    users = users.filter(user => user.username !== username);
    saveUsers();
    displayUsers();
}

function displayUsers() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    users.forEach(user => {
        userList.innerHTML += `
            <div>
                اسم المستخدم: ${user.username}
                <button onclick="deleteUser('${user.username}')">حذف</button>
            </div>
        `;
    });
}

function navigateToUserManagement() {
    window.location.href = 'user_management.html';
}
