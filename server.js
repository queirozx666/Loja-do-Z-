const http = require('http');
const fs = require('fs');
const path = require('path');
const { executarQueryNeon } = require('./script_db_quantum');

const PORTA = process.env.PORT || 3001;

const arquivos = {
    '/': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/index.html': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/app.js': { arquivo: 'app.js', tipo: 'text/javascript; charset=utf-8' }
};

function responderJSON(res, status, dados) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(dados));
}

function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        let corpo = '';
        req.on('data', pedaco => corpo += pedaco);
        req.on('end', () => {
            try {
                resolve(JSON.parse(corpo || '{}'));
            } catch (erro) {
                reject(erro);
            }
        });
    });
}

const servidor = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    if (req.url === "/api/categorias" && req.method === "GET") {
        try {
            const resultado = await executarQueryNeon("SELECT * FROM categorias ORDER BY id_categoria DESC");
            return responderJSON(res, 200, resultado.rows || resultado);
        } catch (erro) {
            return responderJSON(res, 500, { erro: "Erro ao buscar categorias" });
        }
    }

    if (req.url === "/api/categorias" && req.method === "POST") {
        let corpo = '';
        try {
            corpo = await lerCorpo(req);
        } catch (erro) {
            return responderJSON(res, 400, { erro: "JSON inválido" });
        }

        const descricao = (corpo.descricao || '').trim();
        if (!descricao) {
            return responderJSON(res, 400, { erro: "Descrição é obrigatória" });
        }

        try {
            const query = "INSERT INTO categorias (descricao) VALUES ($1) RETURNING *";
            const resultado = await executarQueryNeon(query, [descricao]);
            const novaCategoria = resultado.rows ? resultado.rows[0] : resultado;
            return responderJSON(res, 201, novaCategoria);
        } catch (erro) {
            return responderJSON(res, 500, { erro: "Erro ao salvar categoria" });
        }
    }

    if (req.url.startsWith('/api/categorias/')) {
        const partesUrl = req.url.split('/');
        const idCategoria = partesUrl[3];

        if (req.method === "DELETE") {
            try {
                const query = "DELETE FROM categorias WHERE id_categoria = $1 RETURNING *";
                const resultado = await executarQueryNeon(query, [idCategoria]);
                const removido = resultado.rows ? resultado.rows[0] : resultado;
                
                if (!removido || (Array.isArray(removido) && removido.length === 0)) {
                    return responderJSON(res, 404, { erro: "Categoria não encontrada" });
                }
                return responderJSON(res, 200, { mensagem: "Excluído com sucesso" });
            } catch (erro) {
                return responderJSON(res, 500, { erro: "Erro ao excluir categoria" });
            }
        }

        if (req.method === "PUT") {
            let corpo = '';
            try {
                corpo = await lerCorpo(req);
            } catch (erro) {
                return responderJSON(res, 400, { erro: "JSON inválido" });
            }

            const novaDescricao = (corpo.descricao || '').trim();
            if (!novaDescricao) {
                return responderJSON(res, 400, { erro: "Nova descrição é obrigatória" });
            }

            try {
                const query = "UPDATE categorias SET descricao = $1 WHERE id_categoria = $2 RETURNING *";
                const resultado = await executarQueryNeon(query, [novaDescricao, idCategoria]);
                const atualizado = resultado.rows ? resultado.rows[0] : resultado;

                if (!atualizado || (Array.isArray(atualizado) && atualizado.length === 0)) {
                    return responderJSON(res, 404, { erro: "Categoria não encontrada" });
                }
                return responderJSON(res, 200, Array.isArray(atualizado) ? atualizado[0] : atualizado);
            } catch (erro) {
                return responderJSON(res, 500, { erro: "Erro ao atualizar categoria" });
            }
        }
    }

    const rotaAtual = arquivos[req.url];
    if (rotaAtual && req.method === "GET") {
        const caminhoArquivo = path.join(__dirname, rotaAtual.arquivo);
        fs.readFile(caminhoArquivo, (err, dados) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Arquivo não encontrado');
            } else {
                res.writeHead(200, { 'Content-Type': rotaAtual.tipo });
                res.end(dados);
            }
        });
        return;
    }

    responderJSON(res, 404, { erro: "Rota não encontrada" });
});

servidor.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
});