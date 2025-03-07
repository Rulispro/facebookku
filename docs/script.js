    // 🔹 Buka IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("FacebookBotDB", 1);

        request.onupgradeneeded = (event) => {
            let db = event.target.result;
            let stores = ["settings", "accounts", "groupPosts", "marketplacePhotos", "tasks"];

            stores.forEach((store) => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, {
                        keyPath: "id",
                        autoIncrement: store !== "settings",
                    });
                }
            });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 🔹 Simpan Jam Posting (Autopost Grup & Marketplace)
async function saveSelectedHours() {
    let db = await openDB();
    let transaction = db.transaction("settings", "readwrite");
    let store = transaction.objectStore("settings");

    store.put({ id: "postingHours", hours: getCheckedHours("postingHours") });
    store.put({ id: "marketplaceHours", hours: getCheckedHours("marketplacePostingHours") });

    alert("Jam posting disimpan!");
}

// 🔹 Simpan Cookies Login
async function saveCookies() {
    const cookieInput = document.getElementById("cookieInput").value;
    if (!cookieInput) return alert("Masukkan cookies terlebih dahulu!");

    try {
        let parsedCookies = JSON.parse(cookieInput);
        let db = await openDB();
        let transaction = db.transaction("accounts", "readwrite");
        let store = transaction.objectStore("accounts");

        store.add({ id: new Date().getTime(), cookies: parsedCookies });

        alert("Cookies berhasil disimpan!");
        loadAccounts();
    } catch {
        alert("Format cookies tidak valid!");
    }
}

// 🔹 Muat Akun ke Dropdown
async function loadAccounts() {
    let db = await openDB();
    let accounts = await db.transaction("accounts", "readonly").objectStore("accounts").getAll();

    let dropdown = document.getElementById("accountDropdown");
    dropdown.innerHTML = accounts.map((acc, i) => `<option value="${acc.id}">Akun ${i + 1}</option>`).join("");
}

// 🔹 Simpan Caption & Media Autopost Grup
async function saveGroupPost() {
    let caption = document.getElementById("groupCaption").value;
    let fileInput = document.getElementById("groupMedia").files[0];

    if (!caption && !fileInput) return alert("Masukkan caption atau pilih media!");

    let db = await openDB();
    let transaction = db.transaction("groupPosts", "readwrite");
    let store = transaction.objectStore("groupPosts");

    if (fileInput) {
        let reader = new FileReader();
        reader.onload = (event) => {
            store.add({ id: new Date().getTime(), caption, media: event.target.result });
            alert("Caption dan media berhasil disimpan!");
        };
        reader.readAsDataURL(fileInput);
    } else {
        store.add({ id: new Date().getTime(), caption, media: null });
        alert("Caption berhasil disimpan tanpa media!");
    }
}

// 🔹 Simpan Foto Marketplace
async function saveMarketplacePhoto() {
    let fileInput = document.getElementById("marketplacePhoto").files[0];
    if (!fileInput) return alert("Pilih gambar terlebih dahulu!");

    let reader = new FileReader();
    reader.onload = async (event) => {
        let db = await openDB();
        db.transaction("marketplacePhotos", "readwrite")
            .objectStore("marketplacePhotos")
            .add({ id: new Date().getTime(), image: event.target.result });

        alert("Gambar berhasil disimpan ke Marketplace!");
    };
    reader.readAsDataURL(fileInput);
}

// 🔹 Simpan Task ke IndexedDB
async function saveTask(task) {
    let db = await openDB();
    let transaction = db.transaction("tasks", "readwrite");
    let store = transaction.objectStore("tasks");

    let allowedTasks = ["autolike", "autoposting_group", "autoposting_marketplace", "scrape_groups", "autojoin_group"];
    let priorityTasks = ["autoaddfriend", "autounfriend", "autoconfirm", "autoaddfriend_link_post"];

    // Hapus task yang bentrok jika task baru adalah prioritas
    let existingTasks = await store.getAll();
    existingTasks.forEach((t) => {
        if (priorityTasks.includes(task) && priorityTasks.includes(t.task)) {
            store.delete(t.id);
        }
    });

    // Tambahkan task baru
    store.add({ id: new Date().getTime(), task, timestamp: new Date().toISOString() });
    console.log("✅ Task disimpan:", task);
}

// 🔹 Ambil Semua Task
async function getTasks() {
    let db = await openDB();
    let transaction = db.transaction("tasks", "readonly");
    let store = transaction.objectStore("tasks");
    return await store.getAll();
}

// 🔹 Jalankan Semua Task yang Tersimpan
async function runSavedTasks() {
    let tasks = await getTasks();
    if (tasks.length === 0) return alert("Tidak ada task yang disimpan!");

    tasks.forEach((task) => {
        console.log(`🚀 Menjalankan task: ${task.task}`);
        // Di sini panggil Puppeteer untuk eksekusi sesuai task
    });

    alert("Semua task telah dijalankan!");
}

// 🔹 Dapatkan Jam Terpilih dari Checkbox
function getCheckedHours(id) {
    return Array.from(document.querySelectorAll(`#${id} input:checked`)).map((el) => el.value);
}

// 🔹 Event Listener saat Halaman Dimuat
document.addEventListener("DOMContentLoaded", () => {
    loadAccounts();
    document.querySelectorAll("#postingHours input, #marketplacePostingHours input").forEach((input) => {
        input.addEventListener("change", saveSelectedHours);
    });

    // Tambahkan event listener untuk tombol "Start"
    document.getElementById("runTasksButton").addEventListener("click", runSavedTasks);
});

// 🔹 Function Start untuk Setiap Task
function startAutoLike() {
    saveTask("autolike").then(() => runSavedTasks());
}

function startAutoUnfriend() {
    saveTask("autounfriend").then(() => runSavedTasks());
}

function startAutoAddFriend() {
    saveTask("autoaddfriend").then(() => runSavedTasks());
}

function startAutoConfirm() {
    saveTask("autoconfirm").then(() => runSavedTasks());
}

function startLinkPost() {
    saveTask("autoaddfriend_link_post").then(() => runSavedTasks());
}

function startAutoPost() {
    saveTask("autoposting_group").then(() => runSavedTasks());
}

function startScrapeGroups() {
    saveTask("scrape_groups").then(() => runSavedTasks());
}

function startMarketplacePost() {
    saveTask("autoposting_marketplace").then(() => runSavedTasks());
}

// 🔹 Simpan Task Default
saveTask("autolike"); 
saveTask("autoposting_group"); 
saveTask("autoposting_marketplace"); 
saveTask("scrape_groups"); 
saveTask("autojoin_group");

// 🔹 Simpan Task Prioritas (Hanya Satu Bisa Berjalan)
saveTask("autoaddfriend"); 
saveTask("autounfriend"); 
saveTask("autoconfirm"); 
saveTask("autoaddfriend_link_post");
