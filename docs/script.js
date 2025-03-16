// ====== KONFIGURASI GITHUB ======
const repo = 'username/repo'; // Ganti dengan repo kamu
const token = 'ghp_xxx'; // Ganti dengan token GitHub kamu

// ====== FUNGSI INDEXEDDB ======

// Buka Database
async function openDB() {
    return await idb.openDB('facebookBotDB', 1, {
        upgrade(db) {
            db.createObjectStore('tasks', { keyPath: 'id' });
            db.createObjectStore('cookies', { keyPath: 'id' });
        }
    });
}

// ====== FUNGSI TASK ======

// Tambahkan Task Baru
async function saveTask(task) {
    let db = await openDB();
    let store = db.transaction('tasks', 'readwrite').objectStore('tasks');
    let data = { id: new Date().getTime(), task, timestamp: new Date().toISOString() };
    await store.add(data);
    console.log("✅ Task disimpan:", task);
    await updateTaskJSONToGitHub();
}

// Ambil Semua Task
async function getTasks() {
    let db = await openDB();
    let store = db.transaction("tasks", "readonly").objectStore("tasks");
    return await store.getAll();
}

// ====== FUNGSI COOKIES (LOGIN MULTI AKUN) ======

// Simpan Cookies
async function saveCookies(name, cookies) {
    const db = await openDB();
    const store = db.transaction('cookies', 'readwrite').objectStore('cookies');
    await store.put({ id: name, cookies });
    console.log("✅ Cookies tersimpan untuk:", name);
    loadAccounts(); // Refresh dropdown akun
}

// Ambil Semua Cookies
async function getCookies() {
    const db = await openDB();
    const store = db.transaction('cookies', 'readonly').objectStore('cookies');
    return await store.getAll();
}

// Load ke Dropdown Akun
async function loadAccounts() {
    const accounts = await getCookies();
    const dropdown = document.getElementById('akunDropdown');
    dropdown.innerHTML = ""; // Kosongkan dulu
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.innerText = acc.id;
        dropdown.appendChild(option);
    });
    console.log("✅ Akun dimuat:", accounts.map(a => a.id));
}

// Pilih Akun & Auto-login
document.getElementById('akunDropdown').addEventListener('change', function () {
    const akun = this.value;
    alert(`Akun "${akun}" terpilih, bot akan login otomatis!`);
    // Tambahkan trigger bot login pakai cookies disini
});

// ====== FUNGSI JAM CHECKBOX (GRUP & MARKETPLACE) ======

// Ambil Jam yang Dicentang
function getCheckedHours(id) {
    return Array.from(document.querySelectorAll(`#${id} input:checked`)).map((el) => el.value);
}

// Simpan Jam Terpilih
function saveSelectedHours() {
    const postingHours = getCheckedHours('postingHours');
    const marketplaceHours = getCheckedHours('marketplacePostingHours');
    localStorage.setItem('postingHours', JSON.stringify(postingHours));
    localStorage.setItem('marketplacePostingHours', JSON.stringify(marketplaceHours));
    console.log('✅ Jam posting tersimpan:', postingHours, marketplaceHours);
}

// Load Jam Terpilih ke Checkbox
function loadSelectedHours() {
    const postingHours = JSON.parse(localStorage.getItem('postingHours')) || [];
    const marketplaceHours = JSON.parse(localStorage.getItem('marketplacePostingHours')) || [];

    document.querySelectorAll('#postingHours input').forEach((input) => {
        input.checked = postingHours.includes(input.value);
    });
    document.querySelectorAll('#marketplacePostingHours input').forEach((input) => {
        input.checked = marketplaceHours.includes(input.value);
    });

    console.log('✅ Jam posting dimuat:', postingHours, marketplaceHours);
}

// ====== FUNGSI UPLOAD KE GITHUB ======

// Generate tasks.json
async function generateTasksJSON() {
    let tasks = await getTasks();
    let formattedTasks = tasks.map(t => ({ type: t.task, timestamp: t.timestamp }));
    return JSON.stringify(formattedTasks, null, 2);
}

// Upload ke GitHub
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

// ====== JALANKAN TASK OTOMATIS ======

async function runSavedTasks() {
    let tasks = await getTasks();
    if (tasks.length === 0) return alert("Tidak ada task yang disimpan!");
    tasks.forEach((task) => console.log(`🚀 Menjalankan task: ${task.task}`));
    alert("Semua task telah dijalankan otomatis!");
}

// ====== START FUNCTION PER TASK ======

function startAutoLike() { saveTask("autolike").then(runSavedTasks); }
function startAutoUnfriend() { saveTask("autounfriend").then(runSavedTasks); }
function startAutoAddFriend() { saveTask("autoaddfriend").then(runSavedTasks); }
function startAutoConfirm() { saveTask("autoconfirm").then(runSavedTasks); }
function startLinkPost() { saveTask("autoaddfriend_link_post").then(runSavedTasks); }
function startAutoPost() { saveTask("autoposting_group").then(runSavedTasks); }
function startScrapeGroups() { saveTask("scrape_groups").then(runSavedTasks); }
function startMarketplacePost() { saveTask("autoposting_marketplace").then(runSavedTasks); }

// ====== TASK WAJIB HARIAN ======

saveTask("autolike");
saveTask("autoposting_group");
saveTask("autoposting_marketplace");
saveTask("scrape_groups");
saveTask("autojoin_group");

// ====== TASK PRIORITAS ======

saveTask("autoaddfriend");
saveTask("autounfriend");
saveTask("autoconfirm");
saveTask("autoaddfriend_link_post");

// ====== UPLOAD FILE (EXCEL & GAMBAR) ======

async function simpanFileKeIndexedDB(nama, file) {
    const db = await openDB();
    const store = db.transaction('tasks', 'readwrite').objectStore('tasks');
    await store.put({ id: new Date().getTime(), task: nama, file, timestamp: new Date().toISOString() });
}

async function simpanGambarMarketplace(files) {
    const db = await openDB();
    const store = db.transaction('tasks', 'readwrite').objectStore('tasks');
    for (const file of files) {
        await store.put({ id: new Date().getTime(), task: 'gambar_marketplace', file, filename: file.name, timestamp: new Date().toISOString() });
    }
}

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

// ====== SAAT HALAMAN DIMUAT ======

document.addEventListener("DOMContentLoaded", () => {
    loadAccounts();
    loadSelectedHours();
    document.querySelectorAll("#postingHours input, #marketplacePostingHours input").forEach((input) => input.addEventListener("change", saveSelectedHours));
    document.getElementById("runTasksButton").addEventListener("click", runSavedTasks);
});
