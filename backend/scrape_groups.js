const puppeteer = require('puppeteer');
const fs = require('fs');
const xlsx = require('xlsx');
const cookies = require('./cookies.json'); // Ambil cookies dari file
const tasks = require('./tasks.json'); // Optional: buat manajemen task

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Set cookies login Facebook
    await page.setCookie(...cookies);
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

    console.log('Login berhasil, mulai scrape nama grup...');

    // Ambil keyword dari tasks.json
    const { keyword } = tasks.scrape_group;

    // Akses pencarian grup
    await page.goto(`https://www.facebook.com/search/groups/?q=${keyword}`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000); // Tunggu halaman termuat

    // Scroll untuk munculkan grup
    for (let i = 0; i < 5; i++) { // Scroll 5 kali, bisa diubah sesuai kebutuhan
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(3000);
    }

    // Ambil nama dan link grup, LIMIT MAKSIMAL 100
    const groups = await page.$$eval('a[href*="/groups/"]', links => 
        Array.from(new Set(links.map(link => ({
            name: link.innerText,
            url: link.href.split('?')[0]
        })))).slice(0, 100) // Batas maksimal 100 grup
    );

    console.log(`Berhasil scrape ${groups.length} grup (maksimal 100)`);

    // Buat file Excel
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(groups);
    xlsx.utils.book_append_sheet(wb, ws, 'Groups');

    // Simpan ke file Excel lokal
    const fileName = `result/scraped_groups_${Date.now()}.xlsx`;
    xlsx.writeFile(wb, fileName);

    console.log(`Data tersimpan di: ${fileName}`);

    await browser.close();
})();
