# WhatsApp Lottie Maker

![Node.js](https://img.shields.io/badge/Node.js-Ready-339933?logo=node.js&logoColor=white)
![Baileys](https://img.shields.io/badge/WhatsApp%20API-Baileys-25D366?logo=whatsapp&logoColor=white)
![Lottie](https://img.shields.io/badge/Lottie-.was%20%2F%20Animated%20Stickers-FC5C7D)
![adm-zip](https://img.shields.io/badge/ZIP-adm--zip-4B5563)
![Pino](https://img.shields.io/badge/Logs-pino-111827)

Bot de WhatsApp feito em Node.js que gera figurinhas animadas em tela cheia no formato `.was` de forma nativa e sem marca d'água. O usuário envia uma imagem com o comando `/lottie` e o bot injeta essa imagem dentro de templates Lottie pré-existentes.

## O que este projeto faz

- Gera stickers Lottie nativos no WhatsApp usando arquivos `.was`.
- Recebe imagem por comando na legenda ou por resposta a uma imagem já enviada.
- Suporta múltiplos templates prontos, organizados na pasta `templates`.
- Usa pareamento por código, sem precisar ler QR Code.
- Evita a conversão do Baileys para WebP enviando a mensagem com `mimetype: 'application/was'` e `isLottie: true`.
- Faz injeção dinâmica da imagem no `animation/animation_secondary.json`, substituindo os assets corretos em Base64.
- Ajusta a resolução automaticamente para reduzir risco de crash no WhatsApp.


## Recursos

- Geração nativa de stickers animados em formato `.was`.
- Suporte a múltiplos templates prontos.
- Comando de listagem de templates com `/lottie list`.
- Pareamento por código de acesso no WhatsApp.
- Logs com `pino`.
- Estrutura simples para adicionar novos templates sem reescrever o bot.

## Instalação

### Android com Termux

1. Instale e abra o Termux.
2. Atualize os pacotes e instale as dependências principais:

```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
```

3. Clone o repositório:

```bash
git clone https://github.com/fabricio-lp/Lottie-WhatsApp-Maker.git
```

4. Entre na pasta do projeto e instale as dependências:

```bash
cd Lottie-WhatsApp-Maker
npm install
```

5. Inicie o bot:

```bash
node index.js
```

### Windows e Linux

1. Instale o Node.js e o Git no seu sistema.
2. Clone o repositório:

```bash
git clone https://github.com/fabricio-lp/Lottie-WhatsApp-Maker.git
```

3. Acesse a pasta do projeto:

```bash
cd Lottie-WhatsApp-Maker
```

4. Instale as dependências:

```bash
npm install
```

5. Inicie o bot:

```bash
node index.js
```

## Como usar

Na primeira execução, o bot pede no terminal o número do WhatsApp com DDI e DDD. Depois disso, ele gera um código de pareamento sem a necessidade de escanear QR Code.

### Passo a passo do login

1. Execute `node index.js`.
2. Digite seu número no formato internacional, por exemplo: `5511999999999`.
3. Aguarde o código de pareamento aparecer no terminal.
4. No WhatsApp do celular, aguarde a notificação solicitando o código.
5. Digite o código de pareamento no seu devido campo e confirme a autenticação
6. Depois de autenticado, o bot salva a sessão na pasta `auth`. Caso dê algum erro na sessão, basta excluir a pasta e iniciar uma nova sessão.

### Comandos disponíveis

- `/lottie list` mostra os templates disponíveis.
- `/lottie <id>` gera a figurinha usando o template escolhido.

### Enviando a imagem

Você pode usar o bot de duas formas:

1. Enviar uma imagem com o comando na legenda, por exemplo: `/lottie 2`.
2. Responder a uma imagem já enviada no chat com `/lottie 2`.

Se você não informar um ID válido, o bot usa o template padrão definido no código.

## Como adicionar novos templates

1. Coloque o novo arquivo `.was` dentro da pasta `templates`.
2. Abra `src/injector.js`.
3. Adicione o novo arquivo no objeto `TEMPLATE_MAP`, associando um ID numérico ao nome do arquivo.
4. Se necessário, ajuste o conteúdo do template para garantir que o arquivo `animation/animation_secondary.json` exista e contenha assets de imagem compatíveis.
5. Reinicie o bot.

Exemplo de mapeamento:

```js
const TEMPLATE_MAP = {
  1: 'jumpscare.was',
  2: 'spin.was',
  3: 'double.was',
  4: 'meu-novo-template.was'
};
```

## Estrutura do projeto

```text
.
├── index.js
├── package.json
├── src/
│   └── injector.js
└── templates/
    ├── double.was
    ├── jumpscare.was
    └── spin.was
```

## Dependências principais

- `@whiskeysockets/baileys` - conexão com o WhatsApp.
- `adm-zip` - leitura e alteração da estrutura interna dos arquivos `.was`.
- `pino` - logs do bot.

## Licença
```
MIT License

Copyright (c) 2026 Fabrício Lisboa Prado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.```
