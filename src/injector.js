const fs = require('fs/promises');
const path = require('path');
const AdmZip = require('adm-zip');
const JSZip = require('jszip');

const TEMPLATE_MAP = {
    1: 'jumpscare.was',
    2: 'spin.was',
    3: 'double.was'
};

function listAvailableLotties() {
    return Object.entries(TEMPLATE_MAP)
        .map(([id, fileName]) => ({ id: Number.parseInt(id, 10), fileName }))
        .sort((a, b) => a.id - b.id);
}

async function createLottieSticker(imageBuffer, templateId) {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new Error('Invalid image buffer');
    }

    const normalizedTemplateId = Number.parseInt(String(templateId), 10);
    const selectedId = TEMPLATE_MAP[normalizedTemplateId] ? normalizedTemplateId : 1;
    const templateFileName = TEMPLATE_MAP[selectedId];

    const templatePath = path.resolve(__dirname, '..', 'templates', templateFileName);
    const templateBuffer = await fs.readFile(templatePath);

    const PK_SIGNATURE = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
    const zipOffset = templateBuffer.indexOf(PK_SIGNATURE);
    if (zipOffset === -1) throw new Error('ZIP signature not found in template file');

    const wasmHeader = templateBuffer.slice(0, zipOffset);
    const zipPart = templateBuffer.slice(zipOffset);

    const admZip = new AdmZip(zipPart);
    const entries = admZip.getEntries();

    const animationPath = 'animation/animation_secondary.json';
    const animationEntry = admZip.getEntry(animationPath);
    if (!animationEntry) throw new Error(`Template does not contain ${animationPath}`);

    const animationJson = JSON.parse(animationEntry.getData().toString('utf8'));

    if (!Array.isArray(animationJson.assets) || !animationJson.assets[0]) {
        throw new Error('Template animation JSON does not contain assets[0]');
    }

    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    let inject = false;
    animationJson.assets.forEach(asset => {
        if (asset.w && asset.h && !asset.layers) {
            asset.p = imageBase64;
            asset.e = 1;
            inject = true;
        }
    });

    if (!inject) throw new Error('No images found in the assets.');

    const updatedAnimationStr = JSON.stringify(animationJson);

    const jszip = new JSZip();
    for (const entry of entries) {
        if (entry.isDirectory) continue;
        const name = entry.entryName;
        const data = name === animationPath
            ? Buffer.from(updatedAnimationStr, 'utf8')
            : entry.getData();
        jszip.file(name, data, { compression: 'STORE' });
    }

    const newZipBuffer = await jszip.generateAsync({
        type: 'nodebuffer',
        compression: 'STORE'
    });

    return Buffer.concat([wasmHeader, newZipBuffer]);
}

module.exports = { createLottieSticker, listAvailableLotties };
