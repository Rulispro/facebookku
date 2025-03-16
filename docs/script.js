// ====== KONFIGURASI GITHUB ======
const repo = 'Rulispro/Facebook-bot'

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
    let data = { id: new Date().getTime(), ...task, timestamp: new Date().toISOString() };
    await store.add(data);
    console.log("✅ Task disimpan:", task);
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

async function getCookiesByName(name) {
    const db = await openDB();
    const store = db.transaction('cookies', 'readonly').objectStore('cookies');
    const result = await store.get(name);
    return result ? result.cookies : null;
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

// ====== RUN TASK OTOMATIS (SIMULASI) ======

async function runSavedTasks() {
    let tasks = await getTasks();
    if (tasks.length === 0) return alert("Tidak ada task yang disimpan!");
    tasks.forEach((task) => console.log(`🚀 Menjalankan task:`, task));
    alert("Semua task telah disiapkan! Bot akan menjalankan otomatis.");
}

// ====== START TASK FUNCTION ======

async function startTask(type) {
    const akun = document.getElementById('akunDropdown').value;
    const cookies = await getCookiesByName(akun);
    if (!cookies) return alert('Cookies tidak ditemukan untuk akun ini!');
    const task = { type, cookies };
    await saveTask(task);
    alert(`Task ${type} berhasil disimpan!`);
}

// ====== FILE UPLOAD (EXCEL & GAMBAR) ======

async function simpanFileKeIndexedDB(key, file) {
    const db = await openDB();
    const store = db.transaction('tasks', 'readwrite').objectStore('tasks');
    await store.put({ id: key, file });
}

async function simpanGambarMarketplace(files) {
    const db = await openDB();
    const store = db.transaction('tasks', 'readwrite').objectStore('tasks');
    for (const file of files) {
        await store.put({ id: `gambar-${file.name}`, file });
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

    alert('Data berhasil disimpan untuk bot!');
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
        totalScraped++;
        console.log(`Scraping group ke-${totalScraped}`);
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
        totalScraped++;
        console.log(`Scraping member ke-${totalScraped}`);
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

// ====== EXPORT FUNGSI UNTUK DIPAKAI DI BUTTON HTML ======

window.startAutoLike = () => startTask('autolike');
window.startAutoUnfriend = () => startTask('autounfriend');
window.startAutoAddFriend = () => startTask('autoaddfriend');
window.startAutoConfirm = () => startTask('autoconfirm');
window.startLinkPost = () => startTask('autoaddfriend_link_post');
window.startAutoPost = () => startTask('autoposting_group');
window.startMarketplacePost = () => startTask('autoposting_marketplace');
window.handleUpload = handleUpload;
window.startScrapeGroups = startScrapeGroups;
window.stopScrapeGroups = stopScrapeGroups;
window.startScrapeMembers = startScrapeMembers;
window.stopScrapeMembers = stopScrapeMembers;
