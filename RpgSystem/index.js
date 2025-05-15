let participantes = [];
let turnoAtual = 0;
let effects = {};
let gridSize = 10;
let gridCells = [];
let tokens = {};
let editMode = 'move'; // 'move', 'wall', 'obstacle'
let selectedElement = null;
let selectedElementType = null;

//Carrega as informações da sessão anterior
function carregarDados() {
    const dadosSalvos = localStorage.getItem('roll2playData');
    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        participantes = dados.participantes || [];
        turnoAtual = dados.turnoAtual || 0;
        effects = dados.effects || {};
        tokens = dados.tokens || {};
        gridSize = dados.gridSize || 10;
    }

    initBattleGrid();
        if (dados.gridState) {
            dados.gridState.forEach((state, index) => {
                if (state === 'wall') {
                    gridCells[index].classList.add('wall');
                } else if (state === 'obstacle') {
                    gridCells[index].classList.add('obstacle');
                }
            });
        }
        
        participantes.forEach(p => {
            if (tokens[p.nome] !== undefined) {
                const index = tokens[p.nome];
                gridCells[index].classList.add('token');
                gridCells[index].textContent = p.nome.charAt(0);
                gridCells[index].title = p.nome;
            }
        });
}

//Salva os dados da sessão atual
function salvarDados() {

    const gridState = gridCells.map(cell => {
        if (cell.classList.contains('token')) return 'token';
        if (cell.classList.contains('wall')) return 'wall';
        if (cell.classList.contains('obstacle')) return 'obstacle';
        return 'empty';
    });

    const dados = {
        participantes,
        turnoAtual,
        effects,
        tokens,
        gridSize
    };
    localStorage.setItem('roll2playData', JSON.stringify(dados));
}

//Adiciona um participante
function adicionar() {
    const nomeInput = document.getElementById("nome");
    const iniciativaInput = document.getElementById("iniciativa");
    const vidaInput = document.getElementById("vida");
    
    const nome = nomeInput.value.trim();
    const iniciativa = parseInt(iniciativaInput.value);
    const vida = parseInt(vidaInput.value);
    
    if (nome === "") {
        alert("Por favor, insira um nome válido");
        return;
    }
    
    if (isNaN(iniciativa) || iniciativa < 0) {
        alert("Por favor, insira uma iniciativa válida (número positivo)");
        return;
    }
    
    if (isNaN(vida)) {
        alert("Por favor, insira pontos de vida válidos");
        return;
    }
    
    const novoParticipante = { nome, iniciativa, vida };
    participantes.push(novoParticipante);
    
    // Limpar campos
    nomeInput.value = "";
    iniciativaInput.value = "";
    vidaInput.value = "";
    nomeInput.focus();

    atualizarLista();
    salvarDados();
    addTokenToGrid(novoParticipante);
}


function atualizarLista() {
    participantes.sort((a, b) => b.iniciativa - a.iniciativa);
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    participantes.forEach((p, index) => {
        let item = document.createElement("li");

        let efeitoIcone = "";
        if (effects[index] && effects[index].length > 0) {
            effects[index].forEach((efeito) => {
                let descricao = "";
                switch (efeito.tipo) {
                    case "Veneno":
                        descricao = `Enfraquece o alvo, causando entre ${efeito.danoMin}-${efeito.danoMax} de dano por turno. Duração: ${efeito.duracao} turnos.`;
                        break;
                    case "Sangramento":
                        descricao = `O alvo está sangrando, sofrendo ${efeito.danoMin}-${efeito.danoMax} de dano por turno. Duração: ${efeito.duracao} turnos.`;
                        break;
                    case "Atordoado":
                        descricao = `O alvo está desorientado e perde sua ação principal neste turno. Duração: ${efeito.duracao} turnos.`;
                        break;
                    case "Paralisado":
                        descricao = `O alvo está completamente imobilizado, incapaz de agir. Duração: ${efeito.duracao} turnos.`;
                        break;
                    default:
                        descricao = `Efeito desconhecido.`;
                }

                let cor = efeito.tipo === "Veneno" ? "green" :
                          efeito.tipo === "Sangramento" ? "red" :
                          efeito.tipo === "Atordoado" ? "orange" :
                          efeito.tipo === "Paralisado" ? "yellow" : "gray";

                efeitoIcone += `<span class='efeitoIndicador' style='background-color: ${cor};' title='${descricao}'></span>`;
            });
        }


        item.innerHTML = `${p.nome} ${efeitoIcone} - Iniciativa: ${p.iniciativa} - PV: 
            <span id='vida-${index}'>${p.vida}</span>
            <input type='number' id='dano-${index}' placeholder='Dano' style='width: 100px;'>
            <button onclick='aplicarDano(${index})'>Aplicar</button>
            <button onclick='remover(${index})'>Remover</button>
            <button onclick='abrirEfeitos(${index})'>Efeitos</button>`;

        if (index === turnoAtual) item.classList.add("turno");
        lista.appendChild(item);
    });
}

function mostrarEfeitos(index) {
    const efeitoInfo = document.getElementById(`efeito-info-${index}`);
    if (effects[index] && effects[index].length > 0) {
        efeitoInfo.innerHTML = effects[index].map(e => `${e.tipo} (${e.dano} dano/turno, ${e.duracao} turnos)`).join('<br>');
        efeito.style.display = "block";
    }
}

function ocultarEfeitos(index) {
    document.getElementById(`efeito-info-${index}`).style.display = "none";
}

//Remove um participante
function remover(index) {
    participantes.splice(index, 1);
    if (turnoAtual >= participantes.length) {
        turnoAtual = 0;
    }
    atualizarLista();
    salvarDados();
}

//Sistema de dano
function aplicarDano(index) {
    const dano = parseInt(document.getElementById(`dano-${index}`).value);
    if (!isNaN(dano)) {
        participantes[index].vida = Math.max(0, participantes[index].vida - dano);
        atualizarLista();
        adicionarHistorico(participantes[index].nome, dano);
        salvarDados();
    }
}

//Vai para o próximo participante na lista de iniciativa
function proximoTurno() {
    if (participantes.length > 0) {

        let efeitoBloqueante = effects[turnoAtual]?.some(e => e.tipo === "Atordoado" || e.tipo === "Paralisado");

        if (efeitoBloqueante) {
            adicionarHistorico(`${participantes[turnoAtual].nome} está incapacitado e perde o turno!`);
        }
            turnoAtual = (turnoAtual + 1) % participantes.length;
            aplicarEfeitos();
            atualizarLista();
            salvarDados();
        }
    }
        
        

//Adiciona o que aconteceu ao histórico 
function adicionarHistorico(nome, dano) {
    const historico = document.getElementById("historico");
    let mensagem = document.createElement("p");
    if (dano < 0) {
        mensagem.textContent = `${nome} recuperou ${Math.abs(dano)} de vida!` 
    } else {
    mensagem.textContent = `${nome} levou ${dano} de dano!`;
    }
    historico.appendChild(mensagem);
}

//Reseta tudo
function resetIniciative() {
    participantes = [];
    turnoAtual = 0;
    effects = {};
    atualizarLista();
    document.getElementById("historico").innerHTML = "";
    salvarDados();
}

//Abre o bloco de efeitos
function abrirEfeitos(index) {
    const efeitoContainer = document.getElementById("efeitosContainer");
    const participante = participantes[index];

    const efeitosDisponiveis = [
        { tipo: "Veneno", danoMin: 1, danoMax: 4, duracao: 3 },
        { tipo: "Sangramento", danoMin: 1, danoMax: 4, duracao: 2 },
        { tipo: "Atordoado", danoMin: 0, danoMax: 0, duracao: 1 },
        { tipo: "Paralisado", danoMin: 0, danoMax: 0, duracao: 2 }
    ];

    let botoes = efeitosDisponiveis.map(efeito => 
        `<button onclick='adicionarEfeito(${index}, "${efeito.tipo}", ${efeito.danoMin}, ${efeito.danoMax}, ${efeito.duracao})'>
            ${efeito.tipo}
        </button>`
    ).join("");

    efeitoContainer.innerHTML = `
        <p>Adicionar efeito a ${participante.nome}:</p>
        ${botoes}
        <button onclick='fecharEfeitos()'>Fechar</button>
    `;
    efeitoContainer.style.display = "block";
}


function fecharEfeitos() {
    document.getElementById("efeitosContainer").style.display = "none";
}

function adicionarEfeito(index, tipo, danoMin, danoMax, duracao) {
    if (!effects[index]) effects[index] = [];
    effects[index].push({ tipo, danoMin, danoMax, duracao });

    adicionarHistorico(`${tipo} foi aplicado à ${participantes[index].nome} por ${duracao} turnos`);
    fecharEfeitos();
    atualizarLista();
    salvarDados();
}

function aplicarEfeitos() {
    if (participantes.length === 0) return;

    let p = participantes[turnoAtual];
    let index = turnoAtual;

    if (effects[index]) {
        effects[index] = effects[index].filter(efeito => efeito.duracao > 0);
        effects[index].forEach(efeito => {
            let dano = Math.floor(Math.random() * (efeito.danoMax - efeito.danoMin + 1)) + efeito.danoMin;
            p.vida = Math.max(0, p.vida - dano);
            efeito.duracao--;         
            adicionarHistorico(p.nome, dano);
        });

        effects[index] = effects[index].filter(efeito => efeito.duracao > 0);
    }
}

function initBattleGrid() {
    const grid = document.getElementById('battleGrid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 40px)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, 40px)`;
    
    gridCells = [];
    
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        grid.appendChild(cell);
        gridCells.push(cell);
    }
}

function handleCellClick(index) {
    const selectedParticipant = participantes[turnoAtual];
    if (selectedParticipant && tokens[selectedParticipant.nome]) {
        moveToken(selectedParticipant.nome, index);
    }

    const cell = gridCells[index];
    
    if (editMode === 'wall') {
        // Alternar parede
        cell.classList.toggle('wall');
        cell.classList.remove('token', 'obstacle');
        salvarDados();
        return;
    }
    
    if (editMode === 'obstacle') {
        // Alternar objeto
        cell.classList.toggle('obstacle');
        cell.classList.remove('token', 'wall');
        salvarDados();
        return;
    }
    
    // Modo movimento
    if (selectedElement) {
        // Mover elemento selecionado
        if (cell.classList.contains('token') || 
            cell.classList.contains('wall') || 
            cell.classList.contains('obstacle')) {
            return; // Não sobrepor elementos
        }
        
        gridCells[selectedElement.index].classList.remove(selectedElement.type);
        gridCells[selectedElement.index].textContent = '';
        gridCells[selectedElement.index].title = '';
        
        cell.classList.add(selectedElement.type);
        cell.textContent = selectedElement.text;
        cell.title = selectedElement.title;
        
        if (selectedElement.type === 'token') {
            tokens[selectedElement.name] = index;
        }
        
        selectedElement = null;
        salvarDados();
    } else {
        // Selecionar elemento para mover
        if (cell.classList.contains('token')) {
            const participantName = cell.title;
            selectedElement = {
                index,
                type: 'token',
                name: participantName,
                text: cell.textContent,
                title: cell.title
            };
        } else if (cell.classList.contains('wall') || cell.classList.contains('obstacle')) {
            selectedElement = {
                index,
                type: cell.classList.contains('wall') ? 'wall' : 'obstacle',
                text: cell.textContent,
                title: cell.title
            };
        }
    }
}

function addTokenToGrid(participant) {
    if (tokens[participant.nome]) return;

    const emptyCellIndex = gridCells.findIndex(cell =>
        !cell.classList.contains('token') &&
        !cell.classList.contains('wall') &&
        !cell.classList.contains('obstacle')
    );

    if (emptyCellIndex !== -1) {
        tokens[participant.nome] = emptyCellIndex;
        gridCells[emptyCellIndex].classList.add('token');
        gridCells[emptyCellIndex].textContent = participant.nome.charAt(0);
        gridCells[emptyCellIndex].title = participant.nome;
    }
}

function moveToken(participantName, newIndex) {
    const oldIndex = tokens[participantName];
    if (oldIndex !== undefined) {
        gridCells[oldIndex].classList.remove('token');
        gridCells[oldIndex].textContent = '';
        gridCells[oldIndex].title = '';
    }

    tokens[participantName] = newIndex;
    gridCells[newIndex].classList.add('token');
    gridCells[newIndex].textContent = participantName.charAt(0);
    gridCells[newIndex].title = participantName;
}

function expandGrid() {
    gridSize = parseInt(document.getElementById('gridSize').value);
    initBattleGrid();
    Object.keys(tokens).forEach(name => {
     if (tokens[name] < gridSize * gridSize) {
        gridCells[tokens[name]].classList.add('token');
        gridCells[tokens[name]].textContent = name.charAt(0);
        gridCells[tokens[name]].title = name;
     }
    });
}

function clearGrid() {
    if (confirm('Tem certeza que quer limpar o grid?')) {
        initBattleGrid();
        tokens = {};
    }
}

initBattleGrid();
carregarDados();
atualizarLista();
