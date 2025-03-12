import axios from "axios";
import mongoose, { Schema, Document, model } from "mongoose";
import { connectToDatabase } from '../../../config/database';

// Conexão com o banco de dados MongoDB
mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS: 30000, socketTimeoutMS: 45000,})
.then(() => {
  console.log("Conectado ao MongoDB na base MapTopSeller");
})
.catch((err) => {
  console.error("Erro ao conectar ao MongoDB:", err.message);
});


// Log de conexão
mongoose.connection.on("connected", () => {
  console.log("Conectado ao MongoDB na base MapTopSeller");
});

mongoose.connection.on("error", (err) => {
  console.error("Erro ao conectar ao MongoDB:", err.message);
});

// Schema e modelo para a coleção MapTopSeller
interface IToken extends Document {
  access_token: string;
  refresh_token: string;
}

const tokenSchema = new Schema<IToken>(
  {
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
  },
  {
    collection: "MapTopSeller", // Nome fixo da coleção
  },
);

const TokenModel = model<IToken>("MapTopSeller", tokenSchema);

// Função para carregar o token do banco de dados
async function loadTokens(): Promise<IToken | null> {
  try {
    await connectToDatabase();
    return await TokenModel.findOne(); // Carrega o primeiro documento
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err.message);
    return null;
  }// Carrega o primeiro documento
}

// Função para salvar ou atualizar os tokens no banco
async function saveTokens(tokens: { access_token: string; refresh_token: string }) {
  const existingTokens = await loadTokens();
  if (existingTokens) {
    // Atualizar tokens existentes
    existingTokens.access_token = tokens.access_token;
    existingTokens.refresh_token = tokens.refresh_token;
    await existingTokens.save();
  } else {
    // Criar um novo documento com os tokens
    const newToken = new TokenModel(tokens);
    await newToken.save();
  }
}

// Função para renovar o token de acesso
async function renewAccessToken() {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error("Tokens não encontrados no banco de dados.");
  }

  try {
    const response = await axios.post("https://api.mercadolibre.com/oauth/token", null, {
      params: {
        grant_type: "refresh_token",
        client_id: process.env.CLIENT_ID_ML,
        client_secret: process.env.CLIENT_SECRET_ML,
        refresh_token: tokens.refresh_token,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token, refresh_token } = response.data;

    // Salvar os novos tokens no banco de dados
    await saveTokens({ access_token, refresh_token });

    return access_token;
  } catch (error) {
    console.error("Erro ao renovar o access token:", error.response?.data || error.message);
    throw new Error("Não foi possível renovar o access token.");
  }
}

// Função para buscar dados com renovação de token automática
export async function fetchDataWithRetry(query: string, retryCount = 1) {
  try {
    const tokens = await loadTokens();
    if (!tokens) {
      throw new Error("Tokens não encontrados no banco de dados.");
    }

    let accessToken = tokens.access_token;

    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&sort=sold_quantity_desc&limit=10`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const filteredResults = response.data.results;

    const titles: string[] = [];
    const descriptions: string[] = [];
    const allKeywords = new Set<string>();

    await Promise.all(
      filteredResults.map(async (item: any) => {
        try {
          const detailResponse = await axios.get(
            `https://api.mercadolibre.com/items/${item.id}/description`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const keywords = item.attributes
            .filter((attr: any) => attr.id === "BRAND" || attr.id === "ITEM_CONDITION")
            .map((attr: any) => attr.value_name);

          keywords.forEach((keyword: string) => allKeywords.add(keyword));

          titles.push(item.title);
          descriptions.push(detailResponse.data.plain_text || "Descrição não disponível");
        } catch (error) {
          console.error(`Erro ao obter descrição do item ${item.id}:`, error.message);
          titles.push(item.title);
          descriptions.push("Descrição não disponível");
        }
      })
    );

    return {
      titles,
      descriptions,
      keywords: Array.from(allKeywords),
    };
  } catch (error) {
    if (error.response?.status === 401 && retryCount > 0) {
      console.warn("Token expirado. Tentando renovar...");
      try {
        await renewAccessToken();
        return fetchDataWithRetry(query, retryCount - 1);
      } catch (renewError) {
        console.error("Erro ao renovar o token:", renewError.message);
        throw new Error("Erro ao renovar o token.");
      }
    }
    throw error;
  }
}
