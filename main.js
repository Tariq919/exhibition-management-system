document.getElementById('exhibitionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const exhibitionName = document.getElementById('exhibitionName').value;
    const location = document.getElementById('location').value;
    const wilayat = document.getElementById('wilayat').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const exhibitionType = document.getElementById('exhibitionType').value;
    const organizingCompany = document.getElementById('organizingCompany').value;

    fetch('save_exhibition.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            exhibitionName, location, wilayat, startDate, endDate, exhibitionType, organizingCompany
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('exhibitionSuccess').innerText = 'تمت إضافة المعرض بنجاح';
            document.getElementById('exhibitionForm').reset();
            showAllExhibitions();
        } else {
            document.getElementById('exhibitionError').innerText = 'حدث خطأ أثناء إضافة المعرض';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

function showAllExhibitions() {
    fetch('get_exhibitions.php')
    .then(response => response.json())
    .then(data => {
        const exhibitionList = document.getElementById('exhibitionList');
        exhibitionList.innerHTML = '';
        data.forEach(exhibition => {
            const exhibitionItem = document.createElement('div');
            exhibitionItem.innerHTML = `
                <h3>${exhibition.exhibitionName}</h3>
                <p>الموقع: ${exhibition.location}</p>
                <p>الولاية: ${exhibition.wilayat}</p>
                <p>تاريخ البداية: ${exhibition.startDate}</p>
                <p>تاريخ النهاية: ${exhibition.endDate}</p>
                <p>نوع المعرض: ${exhibition.exhibitionType}</p>
                <p>الشركة المنظمة: ${exhibition.organizingCompany}</p>
            `;
            exhibitionList.appendChild(exhibitionItem);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

showAllExhibitions();
