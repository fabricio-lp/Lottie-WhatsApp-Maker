const pino = require('pino');
const {
	default: makeWASocket,
	useMultiFileAuthState,
	downloadMediaMessage,
	DisconnectReason,
	fetchLatestBaileysVersion,
	prepareWAMessageMedia,
	generateMessageID
} = require('@whiskeysockets/baileys');

const { createLottieSticker, listAvailableLotties } = require('./src/injector');

const readline = require('readline');

let phoneNumber = '';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const logger = pino({ level: 'silent' }); 

function unwrapMessageContent(message) {
	if (!message) return null;

	let current = message;

	while (current) {
		if (current.ephemeralMessage?.message) {
			current = current.ephemeralMessage.message;
			continue;
		}

		if (current.viewOnceMessage?.message) {
			current = current.viewOnceMessage.message;
			continue;
		}

		if (current.viewOnceMessageV2?.message) {
			current = current.viewOnceMessageV2.message;
			continue;
		}

		if (current.viewOnceMessageV2Extension?.message) {
			current = current.viewOnceMessageV2Extension.message;
			continue;
		}

		break;
	}

	return current;
}

function getCommandText(messageContent) {
	if (!messageContent) return '';
	return (
		messageContent.conversation ||
		messageContent.extendedTextMessage?.text ||
		messageContent.imageMessage?.caption ||
		''
	).trim();
}

function parseLottieCommand(text) {
	const match = text.match(/^\/lottie(?:\s+(\w+))?\b/i);
	if (!match) {
		return null;
	}

	const rawArg = (match[1] || '').toLowerCase();
	if (rawArg === 'list') {
		return { action: 'list' };
	}

	const parsed = Number.parseInt(rawArg || '1', 10);
	const templateId = Number.isNaN(parsed) ? 1 : parsed;

	return { action: 'generate', templateId };
}

function formatLottieListMessage() {
	const lotties = listAvailableLotties();
	const lines = lotties.map((item) => `${item.id} - ${item.fileName}`);

	return [
		'Lotties disponíveis:',
		...lines,
		'',
		'Use: /lottie <id> para gerar um sticker.'
	].join('\n');
}

function buildQuotedImageMessage(msg, messageContent) {
	const contextInfo =
		messageContent.extendedTextMessage?.contextInfo ||
		messageContent.imageMessage?.contextInfo;

	const quotedMessage = unwrapMessageContent(contextInfo?.quotedMessage);

	if (!quotedMessage?.imageMessage) {
		return null;
	}

	return {
		key: {
			remoteJid: msg.key.remoteJid,
			id: contextInfo.stanzaId || msg.key.id,
			fromMe: false,
			participant: contextInfo.participant || msg.key.participant
		},
		message: quotedMessage
	};
}
async function startBot() {
	const { state, saveCreds } = await useMultiFileAuthState('auth');
	const { version } = await fetchLatestBaileysVersion(); 
	if (!state.creds.registered) {
		const typedNumber = await question('\nDigite o número do WhatsApp com DDI e DDD (ex: 5511999999999): ');
		phoneNumber = typedNumber.replace(/[^0-9]/g, '');
	}

	const sock = makeWASocket({
	    version,
		auth: state,
		logger,
		printQRInTerminal: false,
		browser: ['Ubuntu', 'Chrome', '22.04.4'] 
	});

	if (!state.creds.registered && phoneNumber) {
		setTimeout(async () => {
			try {
				const code = await sock.requestPairingCode(phoneNumber);
				console.log(`\nSEU CÓDIGO DE PAREAMENTO: ${code}\n`);
			} catch (error) {
				console.error('Erro ao pedir o código:', error);
			}
		}, 3000); 
	}

	sock.ev.on('creds.update', saveCreds);


	sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
		if (connection === 'close') {
			const shouldReconnect =
				lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

			if (shouldReconnect) {
				startBot().catch((error) => {
					logger.error({ error }, 'Reconnect failed');
				});
			}
		}
	});

	sock.ev.on('messages.upsert', async ({ messages, type }) => {
		if (type !== 'notify') return;

		const msg = messages?.[0];
		if (!msg || !msg.message) return;

		const jid = msg.key.remoteJid;
		const messageContent = unwrapMessageContent(msg.message);
		const commandText = getCommandText(messageContent);
		const command = parseLottieCommand(commandText);

		if (!command) return;

		if (command.action === 'list') {
			await sock.sendMessage(
				jid,
				{ text: formatLottieListMessage() },
				{ quoted: msg }
			);
			return;
		}

		try {
			let imageSourceMessage = null;

			if (messageContent?.imageMessage) {
				imageSourceMessage = msg;
			} else {
				imageSourceMessage = buildQuotedImageMessage(msg, messageContent);
			}

			if (!imageSourceMessage) {
				await sock.sendMessage(
					jid,
					{ text: 'Envie uma imagem com o comando na legenda ou responda uma imagem com /lottie <id>. Use /lottie list para ver os IDs disponíveis.' },
					{ quoted: msg }
				);
				return;
			}

			const imageBuffer = await downloadMediaMessage(
				imageSourceMessage,
				'buffer',
				{},
				{
					logger,
					reuploadRequest: sock.updateMediaMessage
				}
			);

			if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
				throw new Error('Failed to download image as buffer');
			}

			const finalBuffer = await createLottieSticker(imageBuffer, command.templateId);
			
            await sock.sendMessage(
                jid, 
                {
                    sticker: finalBuffer,
                    mimetype: 'application/was',
                    isLottie: true, 
                    isAnimated: true
                },
                { quoted: msg }
            );

		} catch (error) {
		    console.error('\nERRO:', error, '\n'); 
			logger.error({ error }, 'Failed to generate lottie sticker');
			await sock.sendMessage(
				jid,
				{ text: 'Falha ao gerar o sticker lottie. Tente novamente com outra imagem.' },
				{ quoted: msg }
			);
		}
	});
}

startBot().catch((error) => {
	logger.error({ error }, 'Bot startup failed');
	process.exit(1);
});
