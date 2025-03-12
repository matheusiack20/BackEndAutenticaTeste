import axios from 'axios';

export class GetProductsService {
    async getProducts(nameProduct: string, accessToken: string) {
        try {
            const response = await axios.get(
                `https://api.bling.com.br/Api/v3/produtos?pagina=1&limite=15&criterio=2&tipo=P&nome=${nameProduct}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `${accessToken}`, // Certifique-se de incluir 'Bearer ' no token se necessário
                    },
                }
            );

            // Verifica se a resposta foi bem-sucedida (axios lança erro para respostas com status >= 400 automaticamente)
            if (response.status >= 200 && response.status < 300) {
                return response.data;
            } else {
                throw new Error(`Erro ao realizar requisição: ${response.statusText}`);
            }
        } catch (error) {
            const errorMessage = error.response ? `Erro ao realizar requisição: ${error.response.statusText}` : error.message;
            throw new Error(`Erro ao buscar produtos: ${errorMessage}`);
        }
    }
}
