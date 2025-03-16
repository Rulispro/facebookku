const puppeteer = require('puppeteer');
const fs = require('fs');
const xlsx = require('xlsx');
const cookies = require('./cookies.json');
const tasks = require('./tasks.json');

// Fungsi delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: false }); // Ubah ke true kalau mau headless
    const page = await browser.newPage();

    // Set cookies login Facebook
    await page.setCookie(...cookies);
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

    console.log('Login berhasil, mulai proses auto join grup...');

    // Ambil link grup dari tasks.json (bisa diganti dari Excel kalau perlu)
    let groupLinks = tasks.autojoin_groups; // array of links

    let joinCount = 0;

    for (const groupLink of groupLinks) {
        if (joinCount >= 50) { // Batas maksimal 10 grup per hari
            console.log('Sudah join maksimal 10 grup hari ini.');
            break;
        }

        try {
            console.log(`Mengunjungi grup: ${groupLink}`);
            await page.goto(groupLink, { waitUntil: 'networkidle2' });
            await page.waitForTimeout(5000); // Tunggu halaman grup terbuka

            // Cari tombol "Gabung Grup" atau "Join Group"
            const joinButton = await page.$x("//span[contains(text(), 'Gabung Grup') or contains(text(), 'Join Group')]");
            if (joinButton.length > 0) {
                await joinButton[0].click();
                console.log(`Berhasil mengirim permintaan gabung: ${groupLink}`);
                joinCount++;
            } else {
                console.log(`Tombol gabung tidak ditemukan atau sudah tergabung: ${groupLink}`);
            }

        } catch (err) {
            console.log(`Gagal join grup: ${groupLink}`, err);
        }

        console.log('Menunggu 50 detik sebelum ke grup berikutnya...');
        await delay(50000); // Jeda 50 detik antar join
    }

    console.log(`Proses auto join selesai. Total grup yang di-join hari ini: ${joinCount}`);
    await browser.close();

})();
