const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    let taskFile = 'backend/tasks.json';
    if (!fs.existsSync(taskFile)) return console.log('⚠️ Tidak ada task ditemukan.');

    let tasks = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    let confirmTask = tasks.find(t => t.task === 'autoconfirm');
    if (!confirmTask) return console.log('❌ Tidak ada task autoconfirm ditemukan.');

    let cookiesFile = 'backend/cookies.json';
    if (!fs.existsSync(cookiesFile)) return console.log('❌ Cookies tidak ditemukan!');
    let cookies = JSON.parse(fs.readFileSync(cookiesFile, 'utf8'));

    let browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 360, height: 720 } // Mobile view
    });

    let page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.goto('https://m.facebook.com/friends/center/requests/', { waitUntil: 'networkidle2' });

    console.log('✅ Login berhasil, mulai konfirmasi pertemanan...');

    const maxConfirm = 50; // Bisa diset via HTML lalu tasks.json
    let confirmCount = 0;

    while (confirmCount < maxConfirm) {
        await page.waitForTimeout(Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000); // 5-10 detik acak

        const confirmButtons = await page.$$('a[role="button"][aria-label="Konfirmasi"]');
        console.log(`🔍 Ditemukan ${confirmButtons.length} permintaan pertemanan`);

        if (confirmButtons.length === 0) {
            console.log('✅ Semua permintaan sudah dikonfirmasi atau tidak ada.');
            break;
        }

        for (const btn of confirmButtons) {
            if (confirmCount >= maxConfirm) break;

            await btn.click();
            confirmCount++;
            console.log(`🤝 Konfirmasi ke-${confirmCount}`);
            await page.waitForTimeout(2000); // Delay antar klik
        }

        // Scroll untuk muncul permintaan baru
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    }

    console.log(`✅ Autoconfirm selesai. Total dikonfirmasi: ${confirmCount}`);
    await browser.close();

    // Hapus task setelah selesai
    let remainingTasks = tasks.filter(t => t.task !== 'autoconfirm');
    fs.writeFileSync(taskFile, JSON.stringify(remainingTasks, null, 2), 'utf8');
})();
