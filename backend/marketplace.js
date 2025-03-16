const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const tasks = JSON.parse(fs.readFileSync('./tasks.json', 'utf8'));
const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));

const linkKategori = {
    item: 'https://m.facebook.com/marketplace/create/item',
    vehicle: 'https://m.facebook.com/marketplace/create/vehicle',
    housing: 'https://m.facebook.com/marketplace/create/rental'
};

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });

    for (const cookie of cookies) {
        await page.setCookie(...cookie.cookies);
        await page.goto('https://m.facebook.com/', { waitUntil: 'networkidle0' });

        const marketplaceTasks = tasks.filter(t => t.task === 'marketplace');
        for (const task of marketplaceTasks) {
            const intervalMs = (task.interval || 3600) * 1000;
            const link = linkKategori[task.kategori];

            console.log(`Posting ke kategori: ${task.kategori} | Link: ${link}`);
            for (const data of task.excelData) { // Loop setiap baris Excel
                try {
                    await page.goto(link, { waitUntil: 'networkidle0' });
                    await page.waitForTimeout(5000);

                    // Isi caption (ambil dari kolom Excel)
                    const caption = data.caption || "Tanpa caption";
                    await page.waitForSelector('div[role="textbox"][contenteditable="true"]', { visible: true });
                    await page.click('div[role="textbox"][contenteditable="true"]');
                    await page.keyboard.type(caption, { delay: 50 });
                    console.log('📝 Caption:', caption);

                    // Upload foto
                    const inputFile = await page.$('input[type="file"]');
                    if (inputFile) {
                        const absolutePhotos = task.photos.map(photo => path.resolve(__dirname, '..', photo));
                        await inputFile.uploadFile(...absolutePhotos);
                        console.log('📷 Foto terupload:', absolutePhotos);
                    }

                    await page.waitForTimeout(7000); // Tunggu upload foto

                    // Klik tombol 'Terbitkan'
                    const publishBtn = await page.$x("//span[contains(text(),'Terbitkan') or contains(text(),'Publish')]");
                    if (publishBtn.length > 0) {
                        await publishBtn[0].click();
                        console.log('🚀 Berhasil diterbitkan!');
                    } else {
                        console.log('❌ Tombol Terbitkan tidak ditemukan!');
                    }

                    console.log(`✅ Tunggu ${intervalMs / 1000} detik sebelum posting berikutnya...`);
                    await page.waitForTimeout(intervalMs);
                } catch (err) {
                    console.error(`❌ Error saat posting Marketplace:`, err.message);
                }
            }
        }
    }

    await browser.close();
    console.log('✅ Semua tugas Marketplace selesai!');
})();
