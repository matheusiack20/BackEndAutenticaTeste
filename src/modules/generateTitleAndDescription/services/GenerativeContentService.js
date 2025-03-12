"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerativeContentService = exports.config = void 0;
const openai_1 = __importDefault(require("openai"));
const fs = require('fs');
const GetTopSellersInfoService_1 = require("../../getTopSellers/services/GetTopSellersInfoService");
function fileToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: buffer.toString('base64'),
            mimeType,
        },
    };
}
exports.config = {
    maxDuration: 300,
};
class GenerativeContentService {
    fetchProductDataTopSeller(query, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { titles, keywords } = yield (0, GetTopSellersInfoService_1.fetchDataWithRetry)(query);
                switch (type) {
                    case 'T':
                        return titles;
                    case 'K':
                        return keywords;
                }
            }
            catch (error) {
                console.error("Erro ao buscar dados de produtos: ", error);
                throw new Error("Erro ao buscar dados de produtos: " + error.message);
            }
        });
    }
    generateContent(prompt, isDescription, files) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
            console.log(files);
            const fileArray = Array.isArray(files)
                ? files
                : Object.values(files).flat();
            console.log('filesArray saida:', fileArray);
            const imageParts = fileArray.map((file) => {
                // Converte o buffer em uma string Base64
                return fileToGenerativePart(file.buffer, file.mimetype); // Passe a Base64 para a função
            });
            console.log(imageParts);
            const urlsGPTImages = imageParts.map(part => {
                const { data, mimeType } = part.inlineData;
                return `data:${mimeType};base64,${data}`;
            });
            let response = null;
            if (!isDescription) {
                // Verifica se existem arquivos enviados
                if (files.length !== 0) {
                    // Cria o array de mensagens, incluindo o prompt e todas as imagens
                    const messages = [
                        { type: "text", text: prompt }, // Primeiro, adiciona o texto do prompt
                        ...urlsGPTImages.map(url => ({ type: "image_url", image_url: { url } })) // Adiciona cada imagem como uma entrada separada
                    ];
                    console.log(messages);
                    // Envia a solicitação para o OpenAI
                    response = yield openai.chat.completions.create({
                        model: 'ft:gpt-4o-2024-08-06:map:map-fine-tuning-title:Anna2qal',
                        messages: [{ role: 'user', content: JSON.stringify(messages) }],
                        temperature: 0.7,
                    });
                }
                else {
                    // Caso não existam arquivos, apenas o prompt é enviado
                    response = yield openai.chat.completions.create({
                        model: 'ft:gpt-4o-2024-08-06:map:map-fine-tuning-title:Anna2qal',
                        messages: [
                            { role: 'user', content: [{ type: "text", text: prompt }] },
                        ],
                        temperature: 0.7,
                    });
                }
            }
            else {
                // Verifica se existem arquivos enviados
                if (files.length !== 0) {
                    // Cria o array de mensagens, incluindo o prompt e todas as imagens
                    const messages = [
                        { type: "text", text: prompt }, // Primeiro, adiciona o texto do prompt
                        ...urlsGPTImages.map(url => ({ type: "image_url", image_url: { url } })) // Adiciona cada imagem como uma entrada separada
                    ];
                    console.log(messages);
                    // Envia a solicitação para o OpenAI
                    response = yield openai.chat.completions.create({
                        model: 'ft:gpt-4o-2024-08-06:map:map-fine-tuninganinciateste6:An5MIdtx',
                        messages: [{ role: 'user', content: JSON.stringify(messages) }],
                        temperature: 0.7,
                    });
                }
                else {
                    // Caso não existam arquivos, apenas o prompt é enviado
                    response = yield openai.chat.completions.create({
                        model: 'ft:gpt-4o-2024-08-06:map:map-fine-tuninganinciateste6:An5MIdtx',
                        messages: [
                            { role: 'user', content: [{ type: "text", text: prompt }] },
                        ],
                        temperature: 0.7,
                    });
                }
            }
            const text = (_a = response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content;
            console.log(text);
            // Remover formatação indesejada
            const cleanText = text === null || text === void 0 ? void 0 : text.replace(/```json|```|\n/g, '').trim();
            console.log("console do cleanText", cleanText);
            // Garantir que sempre seja um JSON válido
            function parseSafeJSON(text) {
                try {
                    const parsed = JSON.parse(text);
                    return Array.isArray(parsed) ? parsed : [];
                }
                catch (_a) {
                    return [];
                }
            }
            const jsonArray = parseSafeJSON(cleanText || '[]');
            console.log("imprimindo o jsonArray", jsonArray);
            return jsonArray;
        });
    }
    generateTitleIdentifier(files) {
        return __awaiter(this, void 0, void 0, function* () {
            const promptIdentifier = `
      - Gere um JSON que representa o nome do produto conforme a imagem em anexo.
      - Em caso de produtos compostos (kits), sempre diga a quantidade no nome do produto gerado.
      usando o formato:
      \`\`\`json
      ["ESSE É O NOME DO PRODUTO"]
      \`\`\``;
            return JSON.stringify(yield this.generateContent(promptIdentifier, false, files));
        });
    }
    deleteTemporaryFiles(files) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileArray = Array.isArray(files)
                    ? files
                    : Object.values(files).flat();
                yield Promise.all(fileArray.map((file) => fs.promises.unlink(file.path)));
            }
            catch (error) { }
        });
    }
    generateMetadataTags(title, files) {
        return __awaiter(this, void 0, void 0, function* () {
            let prompt = `Quero que gere palavras-chave para um produto. Use a frase e a imagem fornecidas para gerar uma lista de palavras-chave que possam ser usadas como meta tags. A lista deve estar no formato de um array e cada palavra-chave deve ser uma string separada. QUero somente 1 palavra por string.Quero que tenha somente a cor principal do produto.Quero as palavras em português. Use a web e procure os anúnicos mais vendidos em sites como Amazon, Mercado Livre, Shopee e SHEIN. Use-os como fonte. Aqui estão os detalhes:
    Título: ${title}
    Retorne 1 palavra por string e me retorne um array com 2 strings. Retorne as palavras-chave no formato de um array JSON, exatamente como no exemplo abaixo, sem nenhum comentário adicional:
  \`\`\`json
  [
    "METATAG",
    "METATAG",
    "METATAG"
  ]
  \`\`\`  `;
            if (files) {
                return this.generateContent(prompt, false, files);
            }
            else {
                return this.generateContent(prompt, false);
            }
        });
    }
    generateTitle(title, description, characters, files) {
        return __awaiter(this, void 0, void 0, function* () {
            const topSellerTitle = yield this.fetchProductDataTopSeller(title, 'T');
            console.log(topSellerTitle);
            let prompt = null;
            if (files.length) {
                prompt = `
      Crie titulos usando os parametros (name: ${title},n_t:2)"
      Obs: Inclua detalhes sobre o nome do produto, cor, formato, qualidades e quantidades.
      Regra:
      0) Considere a quantidade de caracteres para criação dos títulos max_character: entre ${characters}-10 à ${characters}+10 
      1) Crie um array \`\`\`json
      2) Use formato:   [nome_tipo_produto]+[marca]+[nome_próprio_produto/modelo/série/versão/coleção] + [1 ou 2 atributos técnicos]
      `;
            }
            else {
                prompt = `
      Crie titulos usando os parametros (name: ${title},n_t:2)"
      Regra:
      1) Crie um array \`\`\`json
      2) Use formato:   [nome_tipo_produto]+[marca]+[nome_próprio_produto/modelo/série/versão/coleção] + [1 ou 2 atributos técnicos]
      `;
            }
            prompt += `
      3) Abaixo são apresentados o principais anúncios de marketplaces, se baseie neles para extrair palavras chaves que podem ser usadas nos anúncios
        [
        ${topSellerTitle}
        ]
      Contudo, não aplique informações exclusivas desse anúncios como tamanho em caso de vestuario, ou no geral informações como revenda, atacado,novo, usado, e estações do ano.
      `;
            if (description) {
                prompt += `
      3.1) As seguintes informações são aplicáveis ao título:
      ${description}
      `;
            }
            prompt += `
      4) Apenas use informações técnicas do produto para complementar o título.
      5) Remova preposições (“De”, “Para”, “E”) entre as palavras após o tratamento, ou formatadores como "()", "{}", "[]".
      6) Não use caracteres especiais como @, #, $, %, *, &, !, ?, - e ","
      7) Diminua a quantidade de atributos técnicos para respeitar o limite de max_character dos títulos, caso o numero de caracteres > max_character.

      SAÍDA: 
      Retorne os n_t títulos no formato de um array JSON, considerando a regra 7) em todos os títulos:
      \`\`\`json
      [
        "EXEMPLO FORMATAÇÃO FRASE",
        "EXEMPLO FORMATAÇÃO FRASE"
      ]
      \`\`\`
      `;
            if (files) {
                return this.generateContent(prompt, false, files);
            }
            else {
                return this.generateContent(prompt, false);
            }
        });
    }
    generateDescription(title, description, files) {
        return __awaiter(this, void 0, void 0, function* () {
            let prompt = null;
            if (description !== null) {
                prompt = `Crie descrições usando os parametros: name: ${title},plus_info: [${description}],n_d: 2`;
            }
            else {
                prompt = `Crie descrições usando os parametros: name: ${title},plus_info: [],n_d: 2`;
            }
            if (files.length) {
                prompt += `
      Inclua detalhes sobre o nome do produto, cor, formato, qualidades e quantidades.`;
            }
            prompt += `

      REGRAS:
      1) Estrutura Geral:
        -Comece apresentando o produto, destacando Descrição inicial atrativa com 50-60 palavras,use primeira pessoa do plural para se referir no produto (ao invês de usar este, use nosso "nome do produto"),Apelo ao público-alvo,Versatilidade, Qualidade e estilo, Tons positivos e encorajadores, por último pule uma linha.
        -Divida a descrição em seções bem definidas: CARACTERÍSTICAS(3 itens),BENEFÍCIOS EXCLUSIVOS(3 itens),POR QUE ESCOLHER NOSSO PRODUTO?(3 itens), FICHA TÉCNICA(9 itens) e DÚVIDAS FREQUENTES(3 itens).
        -Use tag <h2> para indicar o início de seções.

      2) Formatação:
        -Use listas não enumeradas (<ul> e <li>) para tópicos nas seções, sempre. Sempre crie itens por seção.
        -Não faça repetições de características nas seções. Cada seção deve apresentar informações e características únicas do produto, sendo a unica excessão a FICHA TÉCNICA que deve conter todas as características apresentadas.
        -Retorne as descrições em HTML formatado dentro de um array JSON.
        -Seção de 

      RESTRIÇÕES:
      1) Não inclua hashtags ou linguagem informal.
      2) Evite redundâncias entre as n_d descrições geradas.
      3) Não insira chaves adicionais, apenas o array no formato especificado.
      4) Não aplique informações de anuncio do tipo como revenda, atacado,novo, usado, apenas as especificadas em plus_info

      Retorne as n_d descrições em formato JSON:
      \`\`\`json
      [ 
      'Essa é a descrição do produto com introdução e seções',
      'Essa é a descrição do produto com introdução e seções',
      ] 
      \`\`\``;
            if (files) {
                return this.generateContent(prompt, true, files);
            }
            else {
                return this.generateContent(prompt, true);
            }
        });
    }
}
exports.GenerativeContentService = GenerativeContentService;
