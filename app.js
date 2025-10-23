// ===== CONFIGURAÇÃO INICIAL E CONSTANTES =====
const CHAVE_API = "bd1e817c"; 
const URL_BASE = "https://www.omdbapi.com/";
const PLACEHOLDER_POSTER = "https://via.placeholder.com/300x450?text=Sem+Poster";

// ===== CONEXÃO COM O HTML (DOM) =====
const selectTipoBusca = document.getElementById("tipo-busca");
const campoBusca = document.getElementById("campo-busca");
const campoAno = document.getElementById("campo-ano"); // NOVO CAMPO: Ano
const botaoBuscar = document.getElementById("botao-buscar");
const listaResultados = document.getElementById("lista-resultados");
const mensagemStatus = document.getElementById("mensagem-status");
const botaoAnterior = document.getElementById("botao-anterior");
const botaoProximo = document.getElementById("botao-proximo");
const containerPaginacao = document.getElementById("container-paginacao");

// ===== VARIÁVEIS DE ESTADO =====
let estadoBusca = {
    termo: "",
    tipo: "title", 
    paginaAtual: 1,
    totalResultados: 0,
};

// =======================================================
// ===== FUNÇÕES DE CONTROLE E REQUISIÇÃO (FETCH) ========
// =======================================================

// Inicializa a escuta de eventos
function inicializarEventos() {
    botaoBuscar.addEventListener("click", iniciarNovaBusca);
    
    // Suporte para ENTER em qualquer um dos campos de filtro/busca
    campoBusca.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            iniciarNovaBusca();
        }
    });
    campoAno.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            iniciarNovaBusca();
        }
    });

    botaoAnterior.addEventListener("click", paginaAnterior);
    botaoProximo.addEventListener("click", proximaPagina);
    
    selectTipoBusca.addEventListener("change", (e) => {
        estadoBusca.tipo = e.target.value;
        // Ajusta o placeholder baseado no tipo de busca
        if (e.target.value === 'actor') {
             campoBusca.placeholder = "Ex.: Tom Hanks, Angelina Jolie...";
        } else {
             campoBusca.placeholder = "Ex.: Batman, Matrix, Avatar...";
        }
    });

    // Oculta a paginação no início
    containerPaginacao.style.display = 'none';
}

// Inicia uma nova busca (sempre começa da página 1)
function iniciarNovaBusca() {
    estadoBusca.termo = campoBusca.value.trim();
    estadoBusca.paginaAtual = 1;
    pesquisarFilmes();
}

// Navegação de página
function proximaPagina() {
    if (estadoBusca.paginaAtual * 10 < estadoBusca.totalResultados) {
        estadoBusca.paginaAtual++;
        pesquisarFilmes();
    }
}

function paginaAnterior() {
    if (estadoBusca.paginaAtual > 1) {
        estadoBusca.paginaAtual--;
        pesquisarFilmes();
    }
}

// Função para controlar o estado dos botões de paginação
function atualizarPaginacao() {
    const totalPaginas = Math.ceil(estadoBusca.totalResultados / 10);
    const temProxima = estadoBusca.paginaAtual < totalPaginas;
    const temAnterior = estadoBusca.paginaAtual > 1;
    
    containerPaginacao.style.display = estadoBusca.totalResultados > 0 ? 'block' : 'none';

    botaoAnterior.disabled = !temAnterior;
    botaoProximo.disabled = !temProxima;
}


// Função principal de pesquisa
async function pesquisarFilmes() {
    // 1. Validação
    if (!estadoBusca.termo) {
        mensagemStatus.textContent = "Digite o termo desejado para pesquisar.";
        listaResultados.innerHTML = "";
        atualizarPaginacao();
        return;
    }

    // 2. Estado de Carregamento
    mensagemStatus.textContent = "🔄 Buscando filmes, aguarde...";
    listaResultados.innerHTML = "";
    
    // 3. Montagem da URL e Parâmetros
    
    // Pega o ano, se houver, e valida (4 dígitos numéricos)
    const anoBusca = campoAno.value.trim();
    let parametroAno = '';
    
    if (anoBusca && /^\d{4}$/.test(anoBusca)) {
        parametroAno = `&y=${anoBusca}`;
    }
    
    const tipoParam = 's'; // A OMDb usa 's' para pesquisa, independente do filtro selecionado
    
    // A URL agora inclui o parâmetro de ano
    const url = `${URL_BASE}?apikey=${CHAVE_API}&${tipoParam}=${encodeURIComponent(estadoBusca.termo)}&page=${estadoBusca.paginaAtual}${parametroAno}`;
    
    try {
        // 4. Chamada na API
        const resposta = await fetch(url);
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP! Status: ${resposta.status}`);
        }
        
        const dados = await resposta.json();

        // 6. Tratamento de Erro da API (Response: "False")
        if (dados.Response === "False") {
            const termoCompleto = estadoBusca.termo + (anoBusca ? ` (${anoBusca})` : '');
            mensagemStatus.textContent = `Nenhum resultado encontrado para "${termoCompleto}".`;
            estadoBusca.totalResultados = 0;
            listaResultados.innerHTML = "";
            
        } else {
            // 7. Sucesso: Exibe resultados e atualiza status
            estadoBusca.totalResultados = parseInt(dados.totalResults, 10);
            
            exibirFilmes(dados.Search);
            
            const anoExibicao = anoBusca ? ` (Ano: ${anoBusca})` : '';
            mensagemStatus.textContent = 
                `Pág. ${estadoBusca.paginaAtual} de ${Math.ceil(estadoBusca.totalResultados / 10)} — ${estadoBusca.totalResultados} resultados encontrados para "${estadoBusca.termo}"${anoExibicao}.`;
        }

    } catch (erro) {
        // 8. Tratamento de Erro de Rede ou Genérico
        console.error("Erro na busca:", erro);
        mensagemStatus.textContent = "❌ Erro ao buscar dados. Verifique sua conexão ou a chave da API.";
        estadoBusca.totalResultados = 0;
        
    } finally {
        // 9. Sempre atualiza a paginação, independente do resultado
        atualizarPaginacao();
    }
}

// Função para mostrar filmes (sem alterações significativas)
function exibirFilmes(filmes) {
    listaResultados.innerHTML = ""; 
    
    const htmlFilmes = filmes.map(filme => {
        const poster = filme.Poster !== "N/A"
            ? filme.Poster
            : PLACEHOLDER_POSTER;
        
        return `
            <div class="card">
                <img src="${poster}" alt="Pôster do filme ${filme.Title}" loading="lazy">
                <h3>${filme.Title}</h3>
                <p>Ano: ${filme.Year} (${filme.Type})</p>
            </div>
        `;
    }).join(''); 
    
    listaResultados.innerHTML = htmlFilmes;
}

// Inicia a aplicação
inicializarEventos();