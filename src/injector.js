const fs = require('fs/promises');
const path = require('path');
const AdmZip = require('adm-zip');

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

    const wasmHeader = templateBuffer.slice(0, zipOffset);
    const zipPart = templateBuffer.slice(zipOffset);

    const zip = new AdmZip(zipPart);
    
    const animationPath = 'animation/animation_secondary.json';
    const animationEntry = zip.getEntry(animationPath);
    if (!animationEntry) {
        throw new Error(`Template does not contain ${animationPath}`);
    }

    const animationRaw = animationEntry.getData().toString('utf8');
    const animationJson = JSON.parse(animationRaw);

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

	if (!inject) {
		throw new Error('No images found in the assets.');
	}

    const updatedAnimation = Buffer.from(JSON.stringify(animationJson), 'utf8');
    zip.updateFile(animationPath, updatedAnimation);

    const newZipBuffer = zip.toBuffer();
    const finalBuffer = Buffer.concat([wasmHeader, newZipBuffer]);

    return finalBuffer;
}

module.exports = { createLottieSticker, listAvailableLotties };