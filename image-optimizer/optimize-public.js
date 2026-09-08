const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetPublicDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '../store/public');

function getFilesRecursively(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath));
        } else {
            if (/\.(png|jpg|jpeg)$/i.test(file) && !file.endsWith('.bak')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

async function run() {
    const images = getFilesRecursively(targetPublicDir);
    console.log(`Found ${images.length} images to optimize in: ${targetPublicDir}\n`);

    let totalOriginal = 0;
    let totalOptimized = 0;

    for (const imgPath of images) {
        const parsed = path.parse(imgPath);
        const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);

        const origSize = fs.statSync(imgPath).size;
        totalOriginal += origSize;

        try {
            await sharp(imgPath)
                .resize({ width: 1200, withoutEnlargement: true })
                .webp({ quality: 80, effort: 6 })
                .toFile(webpPath);

            const newSize = fs.statSync(webpPath).size;
            totalOptimized += newSize;

            const origKb = (origSize / 1024).toFixed(1);
            const newKb = (newSize / 1024).toFixed(1);
            const savedPct = (((origSize - newSize) / origSize) * 100).toFixed(0);

            console.log(`✅ ${parsed.base} -> ${parsed.name}.webp (${origKb} KB -> ${newKb} KB, -${savedPct}%)`);
        } catch (err) {
            console.error(`❌ Failed ${parsed.base}:`, err.message);
        }
    }

    console.log('\n=======================================');
    console.log(`Total Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Optimized WebP: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Savings: ${(100 - (totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
    console.log('=======================================\n');
}

run();
