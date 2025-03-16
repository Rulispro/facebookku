const puppeteer = require('puppeteer');
const fs = require('fs');

module.exports = async (task) => {
    console.log("🚀 Memulai Auto Add Friend & Follow...");

    const { cookies, max, interval, target } = task;

    const browser = await puppeteer.launch({
        headless: true, // false jika mau lihat prosesnya
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set cookies login
    await page.setCookie(...cookies);

    // Akses halaman target (followers, following, friends)
    await page.goto(`https://www.facebook.com/${target}`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000); // Tunggu halaman siap

    let totalAction = 0;
    let scrollTimes = 0;

    while (totalAction < max && scrollTimes < 20) { // Limit scroll 20x untuk keamanan
        console.log(`🔍 Scroll ke-${scrollTimes + 1}`);
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(3000); // Tunggu orang baru termuat

        // Ambil semua tombol "Tambah Teman" dan "Ikuti"
        const addFriendButtons = await page.$$(`div[aria-label="Tambah Teman"]`);
        const followButtons = await page.$$(`div[aria-label="Ikuti"]`);

        console.log(`👥 Ditemukan ${addFriendButtons.length} tombol Tambah Teman`);
        console.log(`👥 Ditemukan ${followButtons.length} tombol Ikuti`);

        // Gabungkan semua tombol
        const allButtons = [...addFriendButtons, ...followButtons];

        for (const button of allButtons) {
            if (totalAction >= max) break;

            try {
                await button.click();
                totalAction++;
                console.log(`✅ Berhasil action ke-${totalAction}`);
                await page.waitForTimeout(interval * 1000); // jeda antar klik
            } catch (err) {
                console.error('❌ Gagal klik tombol:', err);
            }
        }

        scrollTimes++;
    }

    console.log(`🎉 Selesai. Total berhasil add friend/follow: ${totalAction}`);
    await browser.close();

    // Kosongkan tasks.json setelah selesai
    fs.writeFileSync('backend/tasks.json', '[]', 'utf8');
    console.log("🗑️ Task dihapus dari tasks.json");
};
