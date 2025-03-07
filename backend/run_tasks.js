const { exec } = require("child_process");
const fs = require("fs");

let taskFile = "backend/tasks.json";

if (fs.existsSync(taskFile)) {
    let tasks = JSON.parse(fs.readFileSync(taskFile, "utf8"));

    tasks.forEach((task) => {
        console.log(`🚀 Menjalankan task: ${task.task}`);
        let scriptPath = `backend/${task.task}.js`;

        if (fs.existsSync(scriptPath)) {
            exec(`node ${scriptPath}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Error di ${task.task}:`, error);
                    return;
                }
                console.log(`✅ Output ${task.task}:`, stdout);
            });
        } else {
            console.error(`❌ Script ${task.task}.js tidak ditemukan di backend!`);
        }
    });

    // Hapus task setelah dijalankan agar tidak duplikat
    fs.writeFileSync(taskFile, "[]", "utf8");
} else {
    console.log("⚠️ Tidak ada task ditemukan.");
}
