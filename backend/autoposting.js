const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const tasks = JSON.parse(fs.readFileSync('./tasks.json', 'utf8'));
const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));

(async () => {
    const browser = await puppeteer.launch({
        headless: true, // false jika mau lihat prosesnya
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 }); // Mode mobile

    for (const cookie of cookies) {
        console.log(`🔑 Login akun: ${cookie.name}`);
        await page.setCookie(...cookie.cookies);
        await page.goto('https://m.facebook.com/', { waitUntil: 'networkidle0' });

        // Ambil task posting grup
        const groupTasks = tasks.filter(t => t.task === 'autopostgroup');
        for (const task of groupTasks) {
            const intervalMs = (task.interval || 60) * 1000; // default 60 detik jika tidak diisi

            for (const groupLink of task.groups) {
                console.log(`\n➡️ Mulai posting ke grup: ${groupLink}`);
                try {
                    await page.goto(groupLink, { waitUntil: 'networkidle0' });
                    await page.waitForTimeout(5000); // Tunggu grup kebuka

                    let foundPostButton = false;

                    // Coba klik "Buat postingan publik..." jika ada
                    try {
                        await page.waitForSelector('[aria-label="Buat postingan publik..."]', { visible: true, timeout: 5000 });
                        await page.click('[aria-label="Buat postingan publik..."]');
                        foundPostButton = true;
                        console.log('✅ Klik tombol "Buat postingan publik..."');
                        await page.waitForTimeout(3000);
                    } catch {
                        console.log('⚠️ Tombol "Buat postingan publik..." tidak ditemukan, coba cara lain...');
                    }

                    // Jika tidak ketemu, langsung cari textbox
                    if (!foundPostButton) {
                        await page.waitForSelector('div[role="textbox"][contenteditable="true"]', { visible: true, timeout: 5000 });
                        await page.click('div[role="textbox"][contenteditable="true"]');
                        console.log('✅ Klik langsung textbox untuk mulai menulis.');
                        await page.waitForTimeout(2000);
                    }

                    // Isi caption
                    await page.keyboard.type(task.caption, { delay: 50 });
                    console.log('✍️ Caption diisi: ' + task.caption);

                    // Upload Foto/Video jika ada
                    if (task.imagePath && fs.existsSync(`./backend/image/${task.imagePath}`)) {
                        const [fileChooser] = await Promise.all([
                            page.waitForFileChooser(),
                            page.click('input[type="file"]') // Klik input file
                        ]);
                        await fileChooser.accept([`./backend/image/${task.imagePath}`]);
                        console.log(`🖼️ Foto/Video ${task.imagePath} berhasil diupload.`);
                        await page.waitForTimeout(5000);
                    } else {
                        console.log('⚠️ Gambar tidak ditemukan atau path salah.');
                    }

                    // Klik tombol Posting
                    let tombolPost = await page.$x("//span[contains(text(),'Posting') or contains(text(),'Bagikan')]");
                    if (tombolPost.length > 0) {
                        await tombolPost[0].click();
                        console.log('🚀 Postingan dikirim!');
                    } else {
                        console.log('❌ Gagal menemukan tombol posting.');
                    }

                    // Tunggu antar grup sesuai input user
                    console.log(`🕒 Tunggu ${task.interval || 60} detik (dari input user) sebelum lanjut grup berikutnya...\n`);
                    await page.waitForTimeout(intervalMs);

                } catch (err) {
                    console.error(`❌ Error saat posting ke ${groupLink}:`, err.message);
                }
            }
        }
    }

    await browser.close();
    console.log('✅ Semua grup selesai diposting!');
})();
