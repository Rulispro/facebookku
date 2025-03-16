const token = process.env.GH_TOKEN; // dari secrets GitHub Actions
const repo = process.env.REPO; // otomatis dapet repo

console.log("Token dan Repo berhasil diambil dari ENV");

const fetch = require('node-fetch');
const fs = require('fs');

// Fungsi ambil tasks.json dari repo
async function downloadTasks() {
    const apiUrl = `https://api.github.com/repos/${repo}/contents/tasks.json`;
    const res = await fetch(apiUrl, {
        headers: { Authorization: `token ${token}` }
    });

    if (res.status !== 200) {
        console.error('Gagal ambil tasks.json:', res.status);
        return null;
    }

    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString();
    fs.writeFileSync('tasks.json', content);
    console.log('✅ tasks.json berhasil di-download');
    return JSON.parse(content);
}

// Fungsi utama jalanin bot
async function runBot() {
    const tasks = await downloadTasks();
    if (!tasks || tasks.length === 0) {
        console.log('Tidak ada task untuk dijalankan.');
        return;
    }

    // Loop task dan jalankan sesuai jenis (contoh log saja)
    for (const task of tasks) {
        console.log(`Menjalankan task: ${task.type}`);
        // Tambahkan switch case jika mau action berbeda per task
    }
}

runBot();
