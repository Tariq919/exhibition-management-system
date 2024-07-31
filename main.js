window.onload = function() {
    const currentUser = localStorage.getItem('currentUser');

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

    document.getElementById('exhibitionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addExhibition();
    });
};

function fetchExhibitions() {
    database.ref('exhibitions').on('value', snapshot => {
        const exhibitions = snapshot.val() || {};
        updateCalendar(Object.values(exhibitions));
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
