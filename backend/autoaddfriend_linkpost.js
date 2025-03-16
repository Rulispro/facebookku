const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const tasks = JSON.parse(fs.readFileSync('./tasks.json', 'utf8'));
const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 }); // Mode mobile

    for (const cookie of cookies) {
        console.log(`🔑 Login akun: ${cookie.name}`);
        await page.setCookie(...cookie.cookies);
        await page.goto('https://m.facebook.com/', { waitUntil: 'networkidle0' });

        // Ambil task auto add friend dari postingan
        const addFriendTasks = tasks.filter(t => t.task === 'autoaddfriend_linkpost');
        for (const task of addFriendTasks) {
            const limit = task.limit || 20;
            const intervalMs = (task.interval || 60) * 1000;

            console.log(`\n➡️ Mulai add friend dari postingan: ${task.post_link}`);
            try {
                await page.goto(task.post_link, { waitUntil: 'networkidle0' });
                await page.waitForTimeout(5000);

                // Klik bagian like/komen/share jika perlu, atau scroll
                let counter = 0;
                let previousHeight;
                
                while (counter < limit) {
                    // Cari tombol "Tambahkan Teman" / "Add Friend"
                    const addButtons = await page.$x("//span[contains(text(), 'Tambahkan Teman') or contains(text(), 'Add Friend')]");
                    console.log(`✅ Ditemukan ${addButtons.length} tombol Tambahkan Teman`);

                    for (const button of addButtons) {
                        if (counter >= limit) break;

                        try {
                            await button.click();
                            console.log(`👥 Berhasil klik Tambahkan Teman ke-${counter + 1}`);
                            counter++;
                            await page.waitForTimeout(intervalMs); // Tunggu sesuai input user
                        } catch (err) {
                            console.log(`⚠️ Gagal klik tombol ke-${counter + 1}: ${err.message}`);
                        }
                    }

                    // Scroll jika butuh load teman lainnya
                    previousHeight = await page.evaluate('document.body.scrollHeight');
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                    await page.waitForTimeout(5000);
                    let newHeight = await page.evaluate('document.body.scrollHeight');
                    if (newHeight === previousHeight) break; // Jika tidak ada tambahan, stop scroll
                }

                console.log(`🏁 Selesai menambahkan ${counter} teman dari postingan.`);

            } catch (err) {
                console.error(`❌ Error saat add friend dari postingan:`, err.message);
            }
        }
    }

    await browser.close();
    console.log('✅ Semua tugas add friend dari postingan selesai!');
})();
