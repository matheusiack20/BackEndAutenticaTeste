import axios from 'axios';

export class GetCategoryShopService {
    async getCategory(accessToken: string) {
        try {
            const response = await axios.get(
                'https://api.bling.com.br/Api/v3/categorias/produtos?pagina=1&limite=100',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `${accessToken}`, // Certifique-se de incluir 'Bearer ' no token se necessário
                    },
                }
            );

            console.log(response.data)

            // Verifica se a resposta foi bem-sucedida (adicionando uma verificação explícita)
            if (response.status >= 200 && response.status < 300) {
                const data = response.data;
                
                // Extraindo as descrições dos produtos
                const categories = data.data.map(item => ({
                    id: item.id,
                    descricao: item.descricao
                })).sort((a, b) => a.descricao.localeCompare(b.descricao));

                return categories;
            } else {
                throw new Error(`Erro na requisição: ${response.statusText}`);
            }
        } catch (error) {
            // Se o erro for uma resposta de erro do servidor, você pode acessar mais informações com `error.response`
            const errorMessage = error.response ? `Erro na requisição: ${error.response.statusText}` : error.message;
            throw new Error(`Erro ao buscar categoria de produtos: ${errorMessage}`);
        }
    }
}
