
let jogadorPosX;
let jogadorPosY;
let rodadaAtual = 0;
let matrizAtual;
let matrizInicial;
let linhas;
let colunas;
let posicaoObjetivoX;
let posicaoObjetivoY;
let jogoAtivo = false;
let somAtivo = true;


function Exception(message) {
    this.message = message;
    this.name = "Exception";
}

function inicializarMatriz(dim_x, dim_y) {
    let mat = new Array(dim_y);
    for (let i = 0; i < mat.length; i++) {
        mat[i] = new Array(dim_x);
    }
    return mat;
}

function achatar(matriz) {
    let array = [];
    matriz.forEach((m) => array.push(...m));
    return array;
}

function _posicaoNoArray(posicao) {
    if (typeof colunas === 'undefined' || colunas <= 0) {
        console.error("Número de colunas não definido ou inválido!");
        return -1;
    }
    return colunas * posicao.indice_y + posicao.indice_x;
}

function _atualizarTabuleiroEJogador(ambiente, posicaoJogador) {
    if (!ambiente || !posicaoJogador) {
        console.error("Ambiente ou posição do jogador inválidos para atualização.");
        return;
    }
    let array = achatar(ambiente);
    let indexJogador = _posicaoNoArray(posicaoJogador);
    let labirinto = document.querySelector("section#labirinto");

    if (!labirinto) {
        console.error("Elemento <section id='labirinto'> não encontrado.");
        return;
    }

    let index = 0;
    labirinto.childNodes.forEach((element) => {
        if (element.tagName === "CELL") {
            if (array[index] === 1) {
                if (!element.classList.contains("dead")) {
                    element.classList.add("dead");
                }
                if (element.classList.contains("start")) element.classList.remove("start");
                if (element.classList.contains("finish")) element.classList.remove("finish");

            } else {
                if (element.classList.contains("dead")) {
                    element.classList.remove("dead");
                }
            }

            const cellId = element.id;
            const startCellId = `item${colunas * 0 + 0 + 1}`;
            const finishCellId = `item${colunas * (linhas - 1) + (colunas - 1) + 1}`;

            if(array[index] !== 1) {
                if (cellId === startCellId && !element.classList.contains("start")) {
                    element.classList.add("start");
                } else if (cellId === finishCellId && !element.classList.contains("finish")) {
                    element.classList.add("finish");
                }
            }


            let circle = element.querySelector(".circle");
            if (circle) {
                if (index === indexJogador) {
                    circle.classList.remove("hidden");
                } else {
                    circle.classList.add("hidden");
                }
            } else {
                console.warn(`Círculo não encontrado na célula ${index}`);
            }
            index++;
        }
    });
}

function createCell(element, index, _linhas, _colunas) {
    let cell = document.createElement("cell");
    cell.id = `item${index + 1}`;
    let divCell = document.createElement("div");
    divCell.classList.add("circle", "hidden");

    if (element === 1) {
        cell.classList.add("dead");
    } else if (element === 3) {
        cell.classList.add("start");
        if (index === 0) {
            divCell.classList.remove("hidden");
        }
    } else if (element === 4) {
        cell.classList.add("finish");
    }

    cell.appendChild(divCell);
    return cell;
}

function encontrarPosicao(matriz, valor) {
    for (let y = 0; y < matriz.length; y++) {
        for (let x = 0; x < matriz[0].length; x++) {
            if (matriz[y][x] === valor) {
                return { x: x, y: y };
            }
        }
    }
    return null;
}

function setGridTemplate(section, _linhas, _colunas) {
    section.style.gridTemplateRows = `repeat(${_linhas}, 1fr)`;
    section.style.gridTemplateColumns = `repeat(${_colunas}, 1fr)`;
}


function CelulaEstado(estado_atual, celulas_ativadas, celulas_desativadas) {
    this.estado_atual = estado_atual;
    this.celulas_ativadas = celulas_ativadas;
    this.celulas_desativadas = celulas_desativadas;
}

function calculaEstadoDaCelula(matriz_entrada, estado_atual, i, j, _linhas, _colunas) {
    let indice_max_y = _linhas - 1;
    let indice_max_x = _colunas - 1;
    let estados_vizinhos = [
        (i - 1 >= 0 && j - 1 >= 0) ? matriz_entrada[i - 1][j - 1] : -1,
        (i >= 0 && j - 1 >= 0) ? matriz_entrada[i][j - 1] : -1,
        (i + 1 <= indice_max_y && j - 1 >= 0) ? matriz_entrada[i + 1][j - 1] : -1,
        (i + 1 <= indice_max_y && j >= 0) ? matriz_entrada[i + 1][j] : -1,
        (i + 1 <= indice_max_y && j + 1 <= indice_max_x) ? matriz_entrada[i + 1][j + 1] : -1,
        (i >= 0 && j + 1 <= indice_max_x) ? matriz_entrada[i][j + 1] : -1,
        (i - 1 >= 0 && j + 1 <= indice_max_x) ? matriz_entrada[i - 1][j + 1] : -1,
        (i - 1 >= 0 && j >= 0) ? matriz_entrada[i - 1][j] : -1,
    ];

    let celulas_ativadas = 0;
    let celulas_desativadas = 0;
    for (let k = 0; k < estados_vizinhos.length; k++) {
        if (estados_vizinhos[k] === 1) {
            celulas_ativadas++;
        } else if (estados_vizinhos[k] === 0 || estados_vizinhos[k] === 3 || estados_vizinhos[k] === 4 ) {
            celulas_desativadas++;
        }
    }
    return new CelulaEstado(estado_atual, celulas_ativadas, celulas_desativadas);
}

function calcularMatrizDeEstados(matriz_entrada, _linhas, _colunas) {
    let matriz_estados = inicializarMatriz(_colunas, _linhas);
    for (let i = 0; i < _linhas; i++) {
        for (let j = 0; j < _colunas; j++) {
            matriz_estados[i][j] = calculaEstadoDaCelula(matriz_entrada, matriz_entrada[i][j], i, j, _linhas, _colunas);
        }
    }
    return matriz_estados;
}

function funcaoDeTransicao(matriz_estados, _linhas, _colunas, _posicaoObjetivoX, _posicaoObjetivoY) {
    let matriz_saida = inicializarMatriz(_colunas, _linhas);
    for (let i = 0; i < _linhas; i++) {
        for (let j = 0; j < _colunas; j++) {
            let estado = matriz_estados[i][j];

            if (estado.estado_atual === 1) {
                if (estado.celulas_ativadas <= 3 || estado.celulas_ativadas >= 6) {
                    matriz_saida[i][j] = 0;
                } else {
                    matriz_saida[i][j] = 1;
                }
            } else {
                if (estado.celulas_ativadas > 1 && estado.celulas_ativadas < 5) {
                    matriz_saida[i][j] = 1;
                } else {
                    matriz_saida[i][j] = 0;
                }
            }
        }
    }

    matriz_saida[0][0] = 0;
    matriz_saida[_posicaoObjetivoY][_posicaoObjetivoX] = 0;

    return matriz_saida;
}

function gerarEstadoFuturo(matriz_entrada, _linhas, _colunas, _posicaoObjetivoX, _posicaoObjetivoY) {
    let estados = calcularMatrizDeEstados(matriz_entrada, _linhas, _colunas);
    let matriz_resultado = funcaoDeTransicao(estados, _linhas, _colunas, _posicaoObjetivoX, _posicaoObjetivoY);
    return matriz_resultado;
}


function criarLabirinto(matriz, _linhas, _colunas) {
    const section = document.querySelector("section#labirinto");
    if (!section) {
        console.error("Elemento <section id='labirinto'> não encontrado.");
        return;
    }

    let posInicial = encontrarPosicao(matriz, 3);
    let posFinal = encontrarPosicao(matriz, 4);

    if (!posInicial || !posFinal) {
        console.error("Posição inicial (3) ou final (4) não encontrada na matriz.");
        posInicial = posInicial || { x: 0, y: 0 };
        posFinal = posFinal || { x: _colunas - 1, y: _linhas - 1 };
        matriz[posInicial.y][posInicial.x] = 3;
        matriz[posFinal.y][posFinal.x] = 4;
        console.warn(`Usando posições padrão: Início (${posInicial.x},${posInicial.y}), Fim (${posFinal.x},${posFinal.y})`);
    }

    linhas = _linhas;
    colunas = _colunas;
    posicaoObjetivoX = posFinal.x;
    posicaoObjetivoY = posFinal.y;
    jogadorPosX = posInicial.x;
    jogadorPosY = posInicial.y;

    matrizInicial = JSON.parse(JSON.stringify(matriz));
    matrizAtual = matriz;

    setGridTemplate(section, linhas, colunas);

    let list = achatar(matrizAtual);
    list.forEach((element, index) => {
        section.appendChild(createCell(element, index, linhas, colunas));
    });

    const tentarNovamenteDiv = document.querySelector(".tentar_novamente");
    section.appendChild(tentarNovamenteDiv);

    _atualizarTabuleiroEJogador(matrizAtual, { indice_x: jogadorPosX, indice_y: jogadorPosY });

    rodadaAtual = 0;
    jogoAtivo = true;
    updateRodadaDisplay();
    console.log("Labirinto criado e jogo iniciado.");
}


function updateRodadaDisplay() {
    console.log(`Rodada Atual: ${rodadaAtual}`);
}

function tentarMoverJogador(dx, dy) {
    if (!jogoAtivo) return;

    let novoX = jogadorPosX + dx;
    let novoY = jogadorPosY + dy;

    let proximaMatriz = gerarEstadoFuturo(matrizAtual, linhas, colunas, posicaoObjetivoX, posicaoObjetivoY);
    rodadaAtual++;

    let movimentoValido = false;
    let colisao = false;

    if (novoX >= 0 && novoX < colunas && novoY >= 0 && novoY < linhas) {

        if (proximaMatriz[novoY][novoX] !== 1) {
            movimentoValido = true;
        } else {
            colisao = true;
        }
    } else {
        colisao = true;
    }

    matrizAtual = proximaMatriz;

    if (movimentoValido) {
        jogadorPosX = novoX;
        jogadorPosY = novoY;
        playSound(".audio__blip");
    } else {
        playSound(".audio__fail");
    }

    _atualizarTabuleiroEJogador(matrizAtual, { indice_x: jogadorPosX, indice_y: jogadorPosY });

    verificarFimDeJogo();

    updateRodadaDisplay();
}

function verificarFimDeJogo() {
    if(matrizAtual[jogadorPosY][jogadorPosX] === 1){
        console.log("Fim de Jogo - Você perdeu! (Pisou em uma parede)");
        alert("Fim de Jogo - Você perdeu! (Pisou em uma parede)");
        jogoAtivo = false;
        playSound(".audio__fail");
        return;
    }

    if (jogadorPosX === posicaoObjetivoX && jogadorPosY === posicaoObjetivoY) {
        console.log("Parabéns! Você venceu!");
        alert(`Parabéns! Você venceu em ${rodadaAtual} rodadas!`);
        jogoAtivo = false;
        playSound(".audio__sucess");
    }
}

function handleKeyPress(event) {
    if (!jogoAtivo) return;

    switch (event.key) {
        case "ArrowUp":
            tentarMoverJogador(0, -1);
            break;
        case "ArrowDown":
            tentarMoverJogador(0, 1);
            break;
        case "ArrowLeft":
            tentarMoverJogador(-1, 0);
            break;
        case "ArrowRight":
            tentarMoverJogador(1, 0);
            break;
        default:
            return;
    }
    event.preventDefault();
}

function playSound(selector) {
    if (!somAtivo) return;
    const sound = document.querySelector(selector);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.error("Erro ao tocar som:", e));
    } else {
        console.warn(`Elemento de áudio não encontrado: ${selector}`);
    }
}

function soundToggle() {
    somAtivo = !somAtivo;
    const soundButton = document.querySelector(".sound");
    if (soundButton) {
        soundButton.classList.toggle("off", !somAtivo);
        console.log(`Som ${somAtivo ? 'ativado' : 'desativado'}`);
    }
}

function resetGame() {
    if (!matrizInicial) {
        alert("Carregue um arquivo de labirinto primeiro!");
        return;
    }
    console.log("Reiniciando o jogo...");
    matrizAtual = JSON.parse(JSON.stringify(matrizInicial));

    let posInicial = encontrarPosicao(matrizAtual, 3) || { x: 0, y: 0 };
    jogadorPosX = posInicial.x;
    jogadorPosY = posInicial.y;

    rodadaAtual = 0;
    jogoAtivo = true;
    _atualizarTabuleiroEJogador(matrizAtual, { indice_x: jogadorPosX, indice_y: jogadorPosY });
    updateRodadaDisplay();
    alert("Jogo reiniciado!");
}


document.getElementById("inputfile").addEventListener("change", function () {
    const reader = new FileReader();
    if (this.files.length === 0) {
        console.log("Nenhum arquivo selecionado.");
        return;
    }
    reader.readAsText(this.files[0]);
    reader.addEventListener("load", (e) => {
        const data = e.target.result.split(/\r?\n/);
        const matriz = [];
        let expectedColumns = -1;
        let fileIsValid = true;

        data.forEach((rowString, rowIndex) => {
            if (rowString.trim() === '' && rowIndex === data.length - 1) return;
            if (rowString.trim() === '') {
                console.warn(`Linha ${rowIndex + 1} está vazia ou contém apenas espaços.`);
                return;
            }

            const row = rowString.trim().split(/\s+/).map(Number);

            if(row.some(isNaN)){
                console.error(`Erro na linha ${rowIndex + 1}: Contém valores não numéricos.`);
                fileIsValid = false;
                return;
            }

            if (expectedColumns === -1) {
                expectedColumns = row.length;
            } else if (row.length !== expectedColumns) {
                console.error(`Erro na linha ${rowIndex + 1}: Número de colunas (${row.length}) diferente do esperado (${expectedColumns}).`);
                fileIsValid = false;
                return;
            }
            matriz.push(row);
        });

        if (!fileIsValid || matriz.length === 0 || expectedColumns <= 0) {
            alert("Erro ao processar o arquivo. Verifique o formato:\n- Apenas números separados por espaços.\n- Número consistente de colunas.\n- Pelo menos uma linha e coluna.");
            this.value = '';
            return;
        }

        const numLinhas = matriz.length;
        const numColunas = expectedColumns;

        const inicio = encontrarPosicao(matriz, 3);
        const fim = encontrarPosicao(matriz, 4);
        if (!inicio || !fim) {
            alert("Atenção: Posição inicial (3) ou final (4) não encontrada na matriz. Usando posições padrão (0,0 e canto inferior direito).");
        }


        criarLabirinto(matriz, numLinhas, numColunas);
    });
    reader.addEventListener("error", () => {
        alert("Erro ao ler o arquivo.");
        this.value = '';
    });
});

document.addEventListener('keydown', handleKeyPress);

const soundButton = document.querySelector(".sound");
if (soundButton) {
    soundButton.addEventListener('click', soundToggle);
}

const resetButton = document.querySelector(".solver");
if (resetButton) {
    resetButton.textContent = "Reiniciar";
    resetButton.removeEventListener('click', solucao);
    resetButton.addEventListener('click', resetGame);
}

const inputDados = document.getElementById("inputDados");
if (inputDados) {
    inputDados.style.display = 'none';
}

console.log("Jogo pronto para ser iniciado. Carregue um arquivo de labirinto.");


let solverAtivo = false;
let caminhoSolucao = [];
let passoAtual = 0;
let intervalId = null;

class No {
    constructor(x, y, matriz, rodada, caminho = []) {
        this.x = x;
        this.y = y;
        this.matriz = JSON.parse(JSON.stringify(matriz));
        this.rodada = rodada;
        this.caminho = [...caminho];
        if (caminho.length > 0) {
            this.caminho.push({ x: x, y: y });
        } else {
            this.caminho = [{ x: x, y: y }];
        }
    }
}

function heuristica(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function matrizesIguais(matriz1, matriz2) {
    if (matriz1.length !== matriz2.length) return false;

    for (let i = 0; i < matriz1.length; i++) {
        if (matriz1[i].length !== matriz2[i].length) return false;

        for (let j = 0; j < matriz1[i].length; j++) {
            if (matriz1[i][j] !== matriz2[i][j]) return false;
        }
    }

    return true;
}

function estadoJaVisitado(no, visitados) {
    return visitados.some(v =>
        v.x === no.x &&
        v.y === no.y &&
        matrizesIguais(v.matriz, no.matriz)
    );
}

function encontrarCaminho(maxIteracoes = 1000) {
    if (!matrizAtual || !jogoAtivo) {
        alert("Carregue um labirinto primeiro!");
        return null;
    }

    console.log("Iniciando busca de solução...");

    let inicio = { x: jogadorPosX, y: jogadorPosY };
    let objetivo = { x: posicaoObjetivoX, y: posicaoObjetivoY };
    let abertos = [];
    let fechados = [];
    let iteracoes = 0;


    let noInicial = new No(inicio.x, inicio.y, matrizAtual, rodadaAtual);
    noInicial.g = 0;
    noInicial.h = heuristica(inicio.x, inicio.y, objetivo.x, objetivo.y); // Heurística
    noInicial.f = noInicial.g + noInicial.h; // Função de avaliação f = g + h

    abertos.push(noInicial);

    while (abertos.length > 0 && iteracoes < maxIteracoes) {
        iteracoes++;

        let melhorIndice = 0;
        for (let i = 1; i < abertos.length; i++) {
            if (abertos[i].f < abertos[melhorIndice].f) {
                melhorIndice = i;
            }
        }

        let atual = abertos[melhorIndice];

        if (atual.x === objetivo.x && atual.y === objetivo.y) {
            console.log(`Solução encontrada em ${iteracoes} iterações`);
            return atual.caminho;
        }

        abertos.splice(melhorIndice, 1);
        fechados.push(atual);

        let proximaMatriz = gerarEstadoFuturo(
            atual.matriz,
            linhas,
            colunas,
            posicaoObjetivoX,
            posicaoObjetivoY
        );

        const direcoes = [
            { dx: 0, dy: -1 }, // cima
            { dx: 1, dy: 0 },  // direita
            { dx: 0, dy: 1 },  // baixo
            { dx: -1, dy: 0 }  // esquerda
        ];

        for (const dir of direcoes) {
            let novoX = atual.x + dir.dx;
            let novoY = atual.y + dir.dy;

            if (novoX < 0 || novoX >= colunas || novoY < 0 || novoY >= linhas) {
                continue; // Fora dos limites
            }

            if (proximaMatriz[novoY][novoX] === 1) {
                continue; // É uma parede
            }

            let novoNo = new No(
                novoX,
                novoY,
                proximaMatriz,
                atual.rodada + 1,
                atual.caminho
            );

            // Verifica se o nó já foi visitado
            if (fechados.some(n => n.x === novoNo.x && n.y === novoNo.y &&
                matrizesIguais(n.matriz, novoNo.matriz))) {
                continue;
            }

            // Calcula os valores g, h e f
            novoNo.g = atual.g + 1;
            novoNo.h = heuristica(novoX, novoY, objetivo.x, objetivo.y);
            novoNo.f = novoNo.g + novoNo.h;

            // Verifica se já existe um nó equivalente na lista de abertos com menor custo
            let existeNaMelhorCaminho = abertos.some(
                n => n.x === novoNo.x && n.y === novoNo.y &&
                    matrizesIguais(n.matriz, novoNo.matriz) && n.g <= novoNo.g
            );

            if (!existeNaMelhorCaminho) {
                abertos.push(novoNo);
            }
        }
    }

    console.log(`Busca encerrada após ${iteracoes} iterações sem encontrar solução`);
    return null; // Nenhuma solução encontrada
}

function executarProximoPasso() {
    if (passoAtual >= caminhoSolucao.length - 1) {
        pararSolver();
        console.log("Solução concluída!");
        return;
    }

    const posAtual = caminhoSolucao[passoAtual];
    const proxPos = caminhoSolucao[passoAtual + 1];

    const dx = proxPos.x - posAtual.x;
    const dy = proxPos.y - posAtual.y;

    tentarMoverJogador(dx, dy);

    passoAtual++;
}

function iniciarSolucao(velocidade = 500) {
    if (solverAtivo) {
        pararSolver();
        return;
    }

    caminhoSolucao = encontrarCaminho();

    if (!caminhoSolucao || caminhoSolucao.length <= 1) {
        alert("Não foi possível encontrar uma solução para este labirinto!");
        return;
    }

    console.log(`Solução encontrada com ${caminhoSolucao.length} passos`);
    solverAtivo = true;
    passoAtual = 0;

    intervalId = setInterval(executarProximoPasso, velocidade);

    const solverBtn = document.querySelector(".solver");
    if (solverBtn) {
        solverBtn.textContent = "Parar Solver";
    }
}

function pararSolver() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    solverAtivo = false;

    const solverBtn = document.querySelector(".solver");
    if (solverBtn) {
        solverBtn.textContent = "Iniciar Solver";
    }
}


function solucao() {
    if (solverAtivo) {
        pararSolver();
    } else {
        iniciarSolucao(300);
    }
}


function configurarBotaoSolver() {
    const resetButton = document.querySelector(".solver");
    if (resetButton) {
        resetButton.removeEventListener('click', resetGame);
        resetButton.addEventListener('click', solucao);
        resetButton.textContent = "Iniciar Solver";
    }
}

window.addEventListener('load', configurarBotaoSolver);

const originalResetGame = resetGame;
resetGame = function() {
    originalResetGame();

    pararSolver();
    caminhoSolucao = [];
    passoAtual = 0;
    setTimeout(configurarBotaoSolver, 100);
};