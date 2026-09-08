const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'output');

// Create directories if they don't exist
if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

async function convertImages() {
    const files = fs.readdirSync(inputDir);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

    if (imageFiles.length === 0) {
        console.log("No JPG or PNG images found in the 'input' folder.");
        console.log("Please put your photos in:", inputDir);
        return;
    }

    console.log(`Found ${imageFiles.length} images. Starting conversion to WebP...\n`);

    for (const file of imageFiles) {
        const inputPath = path.join(inputDir, file);
        const fileNameWithoutExt = path.parse(file).name;
        const outputPath = path.join(outputDir, `${fileNameWithoutExt}.webp`);

        try {
            await sharp(inputPath)
                // Resize if width is larger than 1200px (optional, but great for size reduction)
                .resize({ width: 1200, withoutEnlargement: true })
                // Convert to webp with high quality (80 is a good balance between size and quality)
                .webp({ quality: 80, effort: 6 }) 
                .toFile(outputPath);
            
            const originalSize = (fs.statSync(inputPath).size / 1024).toFixed(2);
            const newSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
            
            console.log(`✅ Converted: ${file}`);
            console.log(`   Size: ${originalSize} KB -> ${newSize} KB`);
        } catch (error) {
            console.error(`❌ Failed to convert ${file}:`, error.message);
        }
    }

    console.log(`\n🎉 All done! Optimized WebP images are saved in: ${outputDir}`);
}

convertImages();
