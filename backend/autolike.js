const puppeteer = require('puppeteer');
const fs = require('fs');

module.exports = async (task) => {
    console.log("🚀 Memulai Autolike Facebook...");

    const { cookies, max, interval, reaction } = task;

    const browser = await puppeteer.launch({
        headless: true, // jika mau lihat jalannya proses, ubah jadi false
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set cookies untuk login
    await page.setCookie(...cookies);

    // Pergi ke halaman beranda Facebook
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

    let likedCount = 0;
    let scrollTimes = 0;

    while (likedCount < max && scrollTimes < 20) { // Maksimal scroll 20x biar tidak infinite
        console.log(`🔍 Scrolling ke ${scrollTimes + 1}...`);
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(3000); // Tunggu load postingan

        // Ambil tombol like yang belum diklik
        const likeButtons = await page.$$(`div[aria-label="${reaction}"]`);

        console.log(`❤️ Menemukan ${likeButtons.length} tombol ${reaction}`);

        for (const button of likeButtons) {
            if (likedCount >= max) break;

            try {
                await button.click();
                likedCount++;
                console.log(`👍 Like ke-${likedCount}`);
                await page.waitForTimeout(interval * 1000); // jeda sesuai interval
            } catch (err) {
                console.error('❌ Gagal like:', err);
            }
        }

        scrollTimes++;
    }

    console.log(`✅ Selesai Autolike. Total Like: ${likedCount}`);
    await browser.close();

    // Kosongkan tasks.json setelah selesai
    fs.writeFileSync('backend/tasks.json', '[]', 'utf8');
    console.log("🗑️ Task dihapus dari tasks.json");
};
