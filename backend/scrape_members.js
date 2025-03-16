const puppeteer = require('puppeteer');
const fs = require('fs');
const xlsx = require('xlsx');
const cookies = require('./cookies.json');
const tasks = require('./tasks.json');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Set cookies login Facebook
    await page.setCookie(...cookies);
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

    console.log('Login berhasil, mulai scrape member grup...');

    const { groupLink } = tasks.scrape_member;

    // Masuk ke halaman member grup
    await page.goto(`${groupLink}/members`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000); // Tunggu halaman termuat

    // Scroll untuk munculkan member
    for (let i = 0; i < 10; i++) { // Scroll 10 kali untuk cari member
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(3000);
    }

    // Ambil nama dan link profil member
    const members = await page.$$eval('a[href*="facebook.com/profile.php"], a[href*="facebook.com/people/"]', links => 
        Array.from(new Set(links.map(link => ({
            name: link.innerText,
            profile: link.href.split('?')[0]
        }))))
    );

    console.log(`Berhasil scrape ${members.length} member`);

    // Buat file Excel
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(members);
    xlsx.utils.book_append_sheet(wb, ws, 'Members');

    // Simpan ke file Excel lokal
    const fileName = `result/scraped_members_${Date.now()}.xlsx`;
    xlsx.writeFile(wb, fileName);

    console.log(`Data tersimpan di: ${fileName}`);

    await browser.close();
})();
