require('dotenv').config({ quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("ERRO: DATABASE_URL não encontrada no arquivo .env");
}

const host = new URL(DATABASE_URL).host;
const neonHttpEndpoint = `https://${host}/sql`;

async function executarQueryNeon(querySQL, parametros = []) {
    try {
        const resposta = await fetch(neonHttpEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Neon-Connection-String': DATABASE_URL
            },
            body: JSON.stringify({
                query: querySQL,
                params: parametros
            })
        });

        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            throw new Error(`Erro HTTP ${resposta.status}: ${erroTexto}`);
        }

        const dados = await resposta.json();
        return dados.rows || dados;
    } catch (error) {
        console.error("Falha ao comunicar com o banco de dados Neon: ", error);
        return null;
    }
}

const categoriaMock = [
    { categoria: 'Eletronicos' },
    { categoria: 'Biblioteca' },
    { categoria: 'Moveis' },
    { categoria: 'Roupas' }
];

async function insertData(table, coluna, data) {
    const query = `INSERT INTO ${table} (${coluna}) VALUES ($1) RETURNING *`;
    const params = [data];
    console.log("Executando query:", query, params);
    const linhas = await executarQueryNeon(query, params);
    return linhas !== null;
}

async function testeInsert() {
    for (const element of categoriaMock) {
        await insertData("categorias", "descricao", element.categoria);
    }
}

if (require.main === module) {
    testeInsert();
}

module.exports = { executarQueryNeon, insertData };