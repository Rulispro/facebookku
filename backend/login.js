const puppeteer = require('puppeteer');
const fs = require('fs');

async function loginWithCookies() {
    const taskPath = './tasks.json';
    const taskData = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
    const cookies = taskData.cookies;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

    let username = null;
    let loginSuccess = false;

    try {
        // Tunggu menu profil
        await page.waitForSelector('[aria-label="Buka menu akun"]', { timeout: 10000 });
        console.log('✅ Login berhasil!');

        // Klik menu akun untuk munculin nama
        await page.click('[aria-label="Buka menu akun"]');
        await page.waitForSelector('span[dir="auto"]', { timeout: 5000 });

        // Ambil nama akun
        username = await page.evaluate(() => {
            const el = document.querySelector('span[dir="auto"]');
            return el ? el.innerText : 'Tidak ditemukan';
        });

        console.log('Akun:', username);
        loginSuccess = true;

    } catch (err) {
        console.log('❌ Login gagal!');
    }

    await browser.close();

    // Update tasks.json dengan username
    if (loginSuccess && username) {
        const updatedTask = { ...taskData, username: username };
        fs.writeFileSync(taskPath, JSON.stringify(updatedTask, null, 2));
        console.log('tasks.json updated with username!');
    } else {
        console.log('tasks.json not updated due to login failure.');
    }
}

loginWithCookies();
