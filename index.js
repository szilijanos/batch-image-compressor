const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const sourceDirectory = '../_kicsi';
const outputDirectory = '../_kesz_kicsi';
const quality = 80; // Adjust quality as needed (0-100)
const concurrency = 4; // Number of concurrent image compression tasks

async function compressImagesInDirectory(directoryPath, outputDirectory, outputSuffix = '', quality = 70, concurrency = 4) {
    try {
        // Capture the start time
        const startTime = Date.now();

        // Read all files in the directory
        const files = await fs.readdir(directoryPath);

        // Create output directory if it doesn't exist
        try {
            await fs.access(outputDirectory);
        } catch (err) {
            // Output directory doesn't exist, create it
            await fs.mkdir(outputDirectory);
        }

        // Dynamically import p-limit
        const pLimit = await import('p-limit');
        const limit = pLimit.default(concurrency);

        // Process each file in parallel
        await Promise.all(files.map(async (file, i) => {
            await limit(async () => {
                const filePath = path.join(directoryPath, file);

                // Check if it's an image file (you may want to enhance this check based on your requirements)
                if (file.match(/\.(jpg|jpeg|png)$/i)) {
                    try {
                        // Compress the image
                        const compressedImage = await sharp(filePath).jpeg({ quality }).toBuffer();

                        // Parse the file path to get the base name and extension
                        const { name, ext } = path.parse(file);

                        // Construct the new file name with the suffix appended before the extension
                        const newFileName = name + outputSuffix + ext;

                        // Write the compressed image to the output directory
                        const outputFilePath = path.join(outputDirectory, newFileName);
                        await fs.writeFile(outputFilePath, compressedImage);

                        // Calculate elapsed time for this iteration
                        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2); // Convert to seconds and fix to 2 decimal places

                        console.log(`${elapsedTime}s - ${i + 1}/${files.length} (${(((i + 1) / files.length) * 100).toFixed(2)}%) - ${file} compressed and saved to ${outputFilePath}`);
                    } catch (err) {
                        console.error(`Error compressing ${file}:`, err);
                    }
                } else {
                    console.log(`${file} is not an image file. Skipping...`);
                }
            });
        }));

        // Calculate elapsed time
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2); // Convert to seconds and fix to 2 decimal places

        console.log(`Compression complete. Elapsed time: ${elapsedTime}s`);
    } catch (err) {
        console.error('Error compressing images:', err);
    }
}

// ----------------------
compressImagesInDirectory(sourceDirectory, outputDirectory, '-compressed', quality, concurrency)
    .then(() => import('p-limit'))
    .then((pLimit) => pLimit.default(concurrency));
