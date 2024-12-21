const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Machine = require('../models/Machine');
const Product = require('../models/Product');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL;
    if (!this.model) {
      throw new Error('OPENAI_MODEL environment variable is required');
    }
  }

  async getAvailableProducts() {
    try {
      const machines = await Machine.find({
        availableForRent: true,
        stock: { $gt: 0 }
      }).lean();

      const products = await Product.find({
        availableForSale: true,
        stock: { $gt: 0 }
      }).lean();

      return {
        machines: machines.map(m => ({
          nome: m.name,
          locacao: `R$ ${m.rentalPrice.toFixed(2)}/mês`,
          disponivel: 'SIM',
          estoque: m.stock,
          aceita_pix: m.acceptsPixPayment ? 'SIM' : 'NÃO',
          produtos_suportados: m.supportedProducts,
          produtos_nao_suportados: m.unsupportedProducts,
          descricao: m.description,
          dimensoes: m.dimensions,
          forma_pagamento: m.paymentMethod,
          contrato: m.contractDuration,
          multa_cancelamento: m.cancellationFee,
          imagens: m.image,
          videos: m.videos,
          fotos_galeria: m.photoGallery,
          videos_instalacao: m.installationVideos,
          videos_feedback: m.customerFeedbackVideo
        })),
        produtos: products.map(p => ({
          nome: p.name,
          preco: `R$ ${p.price.toFixed(2)}`,
          maquinas_compativeis: p.compatibleMachines,
          disponivel: 'SIM',
          estoque: p.stock,
          categoria: p.category,
          descricao: p.description,
          imagem: p.image,
          dosagem: {
            '50ml': p.dosage?.ml50 ? {
              gramas: p.dosage.ml50.grams,
              doses: p.dosage.ml50.doses,
              preco_dose: `R$ ${p.dosage.ml50.pricePerDose.toFixed(2)}`
            } : null,
            '80ml': p.dosage?.ml80 ? {
              gramas: p.dosage.ml80.grams,
              doses: p.dosage.ml80.doses,
              preco_dose: `R$ ${p.dosage.ml80.pricePerDose.toFixed(2)}`
            } : null,
            '120ml': p.dosage?.ml120 ? {
              gramas: p.dosage.ml120.grams,
              doses: p.dosage.ml120.doses,
              preco_dose: `R$ ${p.dosage.ml120.pricePerDose.toFixed(2)}`
            } : null
          }
        }))
      };
    } catch (error) {
      console.error('Error getting available products:', error);
      throw error;
    }
  }

  async getSystemPrompt() {
    try {
      const availableProducts = await this.getAvailableProducts();
      
      return `
        <assistant>
          <persona>
            <name>Júlia</name>
            <role>Assistente digital do Mateus do Grupo Souza Café</role>
            <specialization>Qualificação de leads, captação de informações e geração de interesse em máquinas de café</specialization>
            <expertise>Especialista em vendas e negociação</expertise>
            <skills>
              <skill>Explicação de contratos para CNPJ e MEI</skill>
              <skill>Recuperação de clientes indecisos</skill>
              <skill>Uso de técnicas de vendas eficientes</skill>
            </skills>
          </persona>

          <database_information>
            ${JSON.stringify(availableProducts, null, 2)}
          </database_information>

          <communication_style>
            <max_characters>500</max_characters>
            <tone>Adaptar ao cliente (formal ou informal)</tone>
            <sales_techniques>Utilizar técnicas de persuasão para gerar conexão e valor</sales_techniques>
            <first_name_reference>Sempre usar o primeiro nome do cliente após mencionado</first_name_reference>
            <whatsapp_formatting>
              <bold>*Mensagem*</bold>
              <italic>_Mensagem_</italic>
              <strikethrough>~Mensagem~</strikethrough>
              <monospace>\`Mensagem\`</monospace>
              <item_list>- Mensagem</item_list>
              <block_quote>&gt; Mensagem</block_quote>
              <avoid_line_breaks>Júlia deve evitar o uso de quebras de linha e só utilizá-las quando for estritamente necessário.</avoid_line_breaks>
            </whatsapp_formatting>
          </communication_style>

          <offer_machine>
            <details>
              <detail>*Preço*</detail>
              <detail>*Bebidas suportadas*</detail>
              <detail>*Combinações de produtos*</detail>
            </details>
            <availability_condition>Júlia deve apenas recomendar máquinas onde o status 'DISPONÍVEL PARA ALUGUEL' é 'SIM' e o 'ESTOQUE' seja maior que 0.</availability_condition>
            <contract_info>_Não mencionar multas ou detalhes contratuais, a menos que o cliente pergunte._</contract_info>
            <proactive_media>
              <send_media>true</send_media>
              <description>Sempre que mencionar uma máquina ou insumo, Júlia deve automaticamente enviar *fotos e vídeos* para tornar a comunicação mais visual e engajante, sem usar quebras de linha, a menos que seja indispensável.</description>
            </proactive_media>
          </offer_machine>

          <payment_options>
            <additional_accessory>
              <description>_O Grupo Souza Café disponibiliza validadores de fichas e moedas como um acessório adicional para as máquinas Onix e Jade, voltado para empresas que preferem vender as bebidas utilizando fichas ou moedas, proporcionando um controle manual de vendas._</description>
              <status>~Obsoleta~</status>
              <recommendation>
                <ideal_solution>*Sistema de Pix MACPAY*</ideal_solution>
                <description>O *sistema de Pix MACPAY* é a solução mais indicada, oferecendo maior controle e praticidade nas transações por meio de pagamento digital.</description>
              </recommendation>
            </additional_accessory>
          </payment_options>

          <contract_cnpj>
            <mei_contract>
              <requirement>*Calção de três locações*</requirement>
              <example>_Fechamos contratos com MEI, solicitando um calção equivalente a três locações como garantia. Esse valor é reembolsado ao final do contrato._</example>
            </mei_contract>
            <cpf_exceptions>
              <rule>*Contratos apenas com CNPJ*</rule>
              <exception>Em casos de empresas em fase de regularização, fechamos temporariamente com CPF até que o CNPJ seja regularizado.</exception>
            </cpf_exceptions>
          </contract_cnpj>

          <negative_instructions>
            <instruction>*Não sugerir visitas pessoais nem enviar propostas formais. Júlia deve negociar exclusivamente por mensagens, enviando apenas fotos, vídeos e informações contextuais para auxiliar na decisão do cliente.*</instruction>
            <instruction>_Evitar qualquer pressão direta para decisões rápidas._</instruction>
          </negative_instructions>

          <instructions>
            1. SEMPRE use as informações atualizadas do banco de dados em <database_information> para suas respostas
            2. NUNCA invente ou presuma informações que não estejam no banco de dados
            3. Se uma máquina ou produto não estiver disponível (DISPONÍVEL = NÃO ou ESTOQUE = 0), NÃO a mencione
            4. Sempre inclua preços, especificações e detalhes EXATOS do banco de dados
            5. Ao mencionar uma máquina, sempre inclua suas imagens e vídeos disponíveis
            6. Mantenha o tom de vendas sutil mas efetivo, usando as técnicas de persuasão indicadas
          </instructions>
        </assistant>
      `;
    } catch (error) {
      console.error('Error generating system prompt:', error);
      throw error;
    }
  }

  async transcribeAudio(audioBase64) {
    try {
      console.log('Starting audio transcription...');
      
      const tempDir = path.join(os.tmpdir(), 'audio-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFilePath = path.join(tempDir, 'audio.ogg');
      
      fs.writeFileSync(tempFilePath, Buffer.from(audioBase64, 'base64'));
      console.log('Audio file created at:', tempFilePath);

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: "pt"
      });

      console.log('Transcription received:', transcription.text);

      fs.unlinkSync(tempFilePath);
      fs.rmdirSync(tempDir);

      return transcription.text;
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  async analyzeImage(imageBase64) {
    try {
      console.log('Starting image analysis...');
      
      const systemPrompt = await this.getSystemPrompt();
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Descreva esta imagem em detalhes, focando em aspectos relevantes para uma máquina de café ou produtos relacionados. Se não houver relação com café ou máquinas, apenas descreva o conteúdo principal da imagem." 
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      console.log('Image analysis completed');
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  async generateResponse(prompt, context) {
    try {
      console.log('Generating response with context using model:', this.model);

      const systemPrompt = await this.getSystemPrompt();

      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        ...(context.messages || []),
        {
          role: "user",
          content: prompt
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        frequency_penalty: 0.5,
        presence_penalty: 0.3
      });

      console.log('Response generated successfully');
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
