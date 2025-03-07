const { exec } = require("child_process");
const { openDB } = require("../script.js"); // Import fungsi untuk membuka IndexedDB

async function runTasks() {
    let db = await openDB();
    let transaction = db.transaction("tasks", "readonly");
    let store = transaction.objectStore("tasks");
    let tasks = await store.getAll(); // Ambil semua task dari IndexedDB

    if (tasks.length === 0) {
        console.log("🚫 Tidak ada task yang tersimpan.");
        return;
    }

    tasks.forEach((task) => {
        console.log(`🚀 Menjalankan task: ${task.task}`);

        let scriptPath = `backend/${task.task}.js`; // Path ke skrip Puppeteer

        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error saat menjalankan ${task.task}:`, error);
                return;
            }
            if (stderr) {
                console.error(`⚠️ Stderr dari ${task.task}:`, stderr);
                return;
            }
            console.log(`✅ Output dari ${task.task}:`, stdout);
        });
    });
}

// **Jalankan semua task saat file ini dipanggil**
runTasks();
