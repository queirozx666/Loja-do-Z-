const lista = document.getElementById('listaCategorias');
const formulario = document.getElementById('formularioCategoria');
const campoDescricao = document.getElementById('descricao');
const mensagem = document.getElementById('mensagem');

function mostrarMensagem(texto) {
    if (mensagem) {
        mensagem.textContent = texto;
    }
}

async function carregarCategorias() {
    lista.innerHTML = 'Carregando...';
    try {
        const resposta = await fetch('http://localhost:3001/api/categorias');
        const categoriasResposta = await resposta.json();
        if (!resposta.ok) {
            throw new Error(categoriasResposta.erro || 'Erro desconhecido');
        }
        montarLista(categoriasResposta);
    } catch (erro) {
        mostrarMensagem(`Erro ao carregar categorias: ${erro.message}`);
    }
}

function montarLista(dados) {
    lista.innerHTML = '';
    if (dados.length === 0) {
        lista.innerHTML = 'Nenhuma categoria encontrada.';
        return;
    }

    for (const categoria of dados) {
        const item = document.createElement('li');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.marginBottom = '8px';

        const spanTexto = document.createElement('span');
        spanTexto.textContent = `${categoria.id_categoria} - ${categoria.descricao}`;
        item.appendChild(spanTexto);

        const divBotoes = document.createElement('div');

        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.style.marginRight = '5px';
        btnEditar.onclick = async () => {
            const novaDesc = prompt('Edite a descrição da categoria:', categoria.descricao);
            if (!novaDesc) return;

            try {
                const resposta = await fetch(`http://localhost:3001/api/categorias/${categoria.id_categoria}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descricao: novaDesc })
                });
                const resJson = await resposta.json();
                if (resposta.ok) {
                    mostrarMensagem('Categoria atualizada com sucesso!');
                    await carregarCategorias();
                } else {
                    alert(`Erro: ${resJson.erro}`);
                }
            } catch (err) {
                alert('Erro ao conectar com o servidor para editar.');
            }
        };
        divBotoes.appendChild(btnEditar);

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.onclick = async () => {
            if (!confirm(`Deseja realmente excluir a categoria "${categoria.descricao}"?`)) return;

            try {
                const resposta = await fetch(`http://localhost:3001/api/categorias/${categoria.id_categoria}`, {
                    method: 'DELETE'
                });
                if (resposta.ok) {
                    mostrarMensagem('Categoria excluída com sucesso!');
                    await carregarCategorias();
                } else {
                    const resJson = await resposta.json();
                    alert(`Erro: ${resJson.erro}`);
                }
            } catch (err) {
                alert('Erro ao conectar com o servidor para excluir.');
            }
        };
        divBotoes.appendChild(btnExcluir);

        item.appendChild(divBotoes);
        lista.appendChild(item);
    }
}

if (formulario) {
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const descricao = campoDescricao.value.trim();

        if (!descricao) {
            mensagem.textContent = 'Descrição é obrigatória.';
            return;
        }

        try {
            const resposta = await fetch('http://localhost:3001/api/categorias', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ descricao: campoDescricao.value })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                mostrarMensagem(`Categoria criada com sucesso: ${dados.id_categoria} - ${dados.descricao}`);
                campoDescricao.value = '';
                await carregarCategorias();
            } else {
                mostrarMensagem(`Erro ao criar categoria: ${dados.erro || 'Erro desconhecido'}`);
            }
        } catch (erro) {
            mostrarMensagem('Não foi possível conectar ao servidor na porta 3001.');
        }
    });
}

carregarCategorias();