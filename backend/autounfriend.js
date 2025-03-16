const puppeteer = require('puppeteer');
const fs = require('fs');

module.exports = async (task) => {
    console.log("🚀 Memulai Autounfriend Facebook...");

    const { cookies, max, interval } = task;

    const browser = await puppeteer.launch({
        headless: true, // false jika ingin lihat proses berjalan
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set cookies login
    await page.setCookie(...cookies);

    // Buka halaman daftar teman
    await page.goto('https://www.facebook.com/me/friends', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000); // Pastikan teman sudah termuat

    let unfriendCount = 0;
    let scrollTimes = 0;

    while (unfriendCount < max && scrollTimes < 15) { // Batas scroll agar aman
        console.log(`🔍 Scrolling ke ${scrollTimes + 1}...`);
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(3000); // Tunggu teman termuat

        // Cari tombol 3 titik untuk opsi unfriend
        const friendMenus = await page.$$(`div[aria-label="Teman"]`); // Label bahasa Indonesia

        console.log(`👥 Menemukan ${friendMenus.length} teman yang bisa diunfriend`);

        for (const menu of friendMenus) {
            if (unfriendCount >= max) break;

            try {
                // Klik tombol opsi (3 titik)
                await menu.click();
                await page.waitForTimeout(2000);

                // Klik "Hapus pertemanan" (cari tombol di menu)
                const unfriendButton = await page.$x(`//span[contains(text(), 'Hapus pertemanan')]`);
                if (unfriendButton.length > 0) {
                    await unfriendButton[0].click();
                    await page.waitForTimeout(2000);

                    // Konfirmasi hapus pertemanan
                    const confirmButton = await page.$x(`//span[contains(text(), 'Konfirmasi')]`);
                    if (confirmButton.length > 0) {
                        await confirmButton[0].click();
                        console.log(`❌ Unfriend ke-${unfriendCount + 1}`);
                        unfriendCount++;
                        await page.waitForTimeout(interval * 1000); // jeda antar unfriend
                    }
                } else {
                    console.log('⚠️ Tombol "Hapus pertemanan" tidak ditemukan.');
                }

            } catch (err) {
                console.error('❌ Gagal unfriend:', err);
            }
        }

        scrollTimes++;
    }

    console.log(`✅ Selesai Autounfriend. Total unfriend: ${unfriendCount}`);
    await browser.close();

    // Kosongkan tasks.json setelah selesai
    fs.writeFileSync('backend/tasks.json', '[]', 'utf8');
    console.log("🗑️ Task dihapus dari tasks.json");
};
