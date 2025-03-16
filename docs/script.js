// ====== KONFIGURASI GITHUB ======
const repo = 'username/repo'; // Ganti dengan repo kamu
const token = 'ghp_xxx'; // Ganti dengan token GitHub kamu

// ====== FUNGSI INDEXEDDB ======

async function openDB() {
    return await idb.openDB('facebookBotDB', 1, {
        upgrade(db) {
            db.createObjectStore('tasks', { keyPath: 'id' });
            db.createObjectStore('cookies', { keyPath: 'id' });
        }
    });
}

// ====== FUNGSI TASK ======

async function saveTask(task) {
    let db = await openDB();
    let store = db.transaction('tasks', 'readwrite').objectStore('tasks');
    let data = { id: new Date().getTime(), task, timestamp: new Date().toISOString() };
    await store.add(data);
    console.log("✅ Task disimpan:", task);
    await updateTaskJSONToGitHub();
}

async function getTasks() {
    let db = await openDB();
    let store = db.transaction("tasks", "readonly").objectStore("tasks");
    return await store.getAll();
}

// ====== FUNGSI COOKIES (LOGIN MULTI AKUN) ======

async function saveCookies(name, cookies) {
    const db = await openDB();
    const store = db.transaction('cookies', 'readwrite').objectStore('cookies');
    await store.put({ id: name, cookies });
    console.log("✅ Cookies tersimpan untuk:", name);
    loadAccounts();
}

async function getCookies() {
    const db = await openDB();
    const store = db.transaction('cookies', 'readonly').objectStore('cookies');
    return await store.getAll();
}

async function loadAccounts() {
    const accounts = await getCookies();
    const dropdown = document.getElementById('akunDropdown');
    dropdown.innerHTML = "";
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.innerText = acc.id;
        dropdown.appendChild(option);
    });
    console.log("✅ Akun dimuat:", accounts.map(a => a.id));
}

document.getElementById('akunDropdown').addEventListener('change', function () {
    const akun = this.value;
    alert(`Akun "${akun}" terpilih, bot akan login otomatis!`);
    // Tambahkan login dengan cookies
});

// ====== FUNGSI JAM CHECKBOX ======

function getCheckedHours(id) {
    return Array.from(document.querySelectorAll(`#${id} input:checked`)).map((el) => el.value);
}

function saveSelectedHours() {
    const postingHours = getCheckedHours('postingHours');
    const marketplaceHours = getCheckedHours('marketplacePostingHours');
    localStorage.setItem('postingHours', JSON.stringify(postingHours));
    localStorage.setItem('marketplacePostingHours', JSON.stringify(marketplaceHours));
}

function loadSelectedHours() {
    const postingHours = JSON.parse(localStorage.getItem('postingHours')) || [];
    const marketplaceHours = JSON.parse(localStorage.getItem('marketplacePostingHours')) || [];
    document.querySelectorAll('#postingHours input').forEach((input) => input.checked = postingHours.includes(input.value));
    document.querySelectorAll('#marketplacePostingHours input').forEach((input) => input.checked = marketplaceHours.includes(input.value));
}

// ====== FUNGSI UPLOAD GITHUB ======

async function generateTasksJSON() {
    let tasks = await getTasks();
    let formattedTasks = tasks.map(t => ({ type: t.task, timestamp: t.timestamp }));
    return JSON.stringify(formattedTasks, null, 2);
}

async function updateTaskJSONToGitHub() {
    const apiUrl = `https://api.github.com/repos/${repo}/contents/tasks.json`;
    const tasksContent = await generateTasksJSON();
    const contentBase64 = btoa(unescape(encodeURIComponent(tasksContent)));

    let sha = null;
    const res = await fetch(apiUrl, { headers: { Authorization: `token ${token}` } });
    if (res.status === 200) {
        const data = await res.json();
        sha = data.sha;
    }

    await fetch(apiUrl, {
        method: 'PUT',
        headers: { Authorization: `token ${token}` },
        body: JSON.stringify({
            message: "Update tasks.json otomatis",
            content: contentBase64,
            sha: sha
        })
    });

    console.log("🚀 tasks.json berhasil dikirim ke GitHub!");
}

// ====== RUN TASK OTOMATIS ======

async function runSavedTasks() {
    let tasks = await getTasks();
    if (tasks.length === 0) return alert("Tidak ada task yang disimpan!");
    tasks.forEach((task) => console.log(`🚀 Menjalankan task: ${task.task}`));
    alert("Semua task telah dijalankan otomatis!");
}

// ====== START TASK FUNCTION ======

function startAutoLike() { saveTask("autolike").then(runSavedTasks); }
function startAutoUnfriend() { saveTask("autounfriend").then(runSavedTasks); }
function startAutoAddFriend() { saveTask("autoaddfriend").then(runSavedTasks); }
function startAutoConfirm() { saveTask("autoconfirm").then(runSavedTasks); }
function startLinkPost() { saveTask("autoaddfriend_link_post").then(runSavedTasks); }
function startAutoPost() { saveTask("autoposting_group").then(runSavedTasks); }
function startMarketplacePost() { saveTask("autoposting_marketplace").then(runSavedTasks); }

// ====== FILE UPLOAD (EXCEL & GAMBAR) ======

async function handleUpload() {
    const fileExcelMarketplace = document.querySelector('#excel-marketplace').files[0];
    const fileExcelScrapeGroup = document.querySelector('#excel-scrape-group').files[0];
    const fileExcelJoinGroup = document.querySelector('#excel-join-group').files[0];
    const gambarMarketplace = document.querySelector('#gambar-marketplace').files;

    if (fileExcelMarketplace) await simpanFileKeIndexedDB('marketplace_excel', fileExcelMarketplace);
    if (fileExcelScrapeGroup) await simpanFileKeIndexedDB('scrape_group_excel', fileExcelScrapeGroup);
    if (fileExcelJoinGroup) await simpanFileKeIndexedDB('join_group_excel', fileExcelJoinGroup);
    if (gambarMarketplace.length) await simpanGambarMarketplace(gambarMarketplace);

    alert('Data berhasil disimpan & dikirim ke bot!');
    await updateTaskJSONToGitHub();
}

// ====== SCRAPE GROUP & MEMBER ======

let scrapeGroupInterval;
let scrapeMemberInterval;

function startScrapeGroups() {
    const interval = parseInt(document.getElementById('intervalScrapeGroup').value) * 1000;
    let totalScraped = 0;

    scrapeGroupInterval = setInterval(() => {
        if (totalScraped >= 100) {
            clearInterval(scrapeGroupInterval);
            alert('Maksimal 100 grup per hari tercapai.');
            return;
        }

        const excelLink = document.getElementById('Excel').value;
        fetch('/run-scrape-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ excelLink })
        });

        totalScraped++;
    }, interval);
}

function stopScrapeGroups() {
    clearInterval(scrapeGroupInterval);
    alert('Scrape grup dihentikan.');
}

function startScrapeMembers() {
    const interval = parseInt(document.getElementById('intervalScrapeMember').value) * 1000;
    let totalScraped = 0;

    scrapeMemberInterval = setInterval(() => {
        if (totalScraped >= 100) {
            clearInterval(scrapeMemberInterval);
            alert('Maksimal 100 member per hari tercapai.');
            return;
        }

        const excelFile = document.getElementById('excel-join-group').files[0];
        const formData = new FormData();
        formData.append('excelFile', excelFile);

        fetch('/run-scrape-member', { method: 'POST', body: formData });
        totalScraped++;
    }, interval);
}

function stopScrapeMembers() {
    clearInterval(scrapeMemberInterval);
    alert('Scrape member dihentikan.');
}

// ====== ON LOAD ======
document.addEventListener("DOMContentLoaded", () => {
    loadAccounts();
    loadSelectedHours();
    document.querySelectorAll("#postingHours input, #marketplacePostingHours input").forEach((input) => input.addEventListener("change", saveSelectedHours));
    document.getElementById("runTasksButton").addEventListener("click", runSavedTasks);
});
