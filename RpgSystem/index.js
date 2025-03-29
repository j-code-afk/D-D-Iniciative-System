let participantes = [];
let turnoAtual = 0;
let effects = {};

function adicionar() {
    const nome = document.getElementById("nome").value;
    const iniciativa = parseInt(document.getElementById("iniciativa").value);
    const vida = parseInt(document.getElementById("vida").value);
    if (nome && !isNaN(iniciativa) && !isNaN(vida)) {
        participantes.push({ nome, iniciativa, vida });
        atualizarLista();
    }
}

function atualizarLista() {
    participantes.sort((a, b) => b.iniciativa - a.iniciativa);
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    participantes.forEach((p, index) => {
        let item = document.createElement("li");

        let efeitoIcone = "";
        if (effects[index] && effects[index].length > 0) {
            effects[index].forEach((efeito) => {  // <-- Correção aqui
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

function remover(index) {
    participantes.splice(index, 1);
    if (turnoAtual >= participantes.length) {
        turnoAtual = 0;
    }
    atualizarLista();
}

function aplicarDano(index) {
    const dano = parseInt(document.getElementById(`dano-${index}`).value);
    if (!isNaN(dano)) {
        participantes[index].vida = Math.max(0, participantes[index].vida - dano);
        atualizarLista();
        adicionarHistorico(participantes[index].nome, dano);
    }
}

function proximoTurno() {
    if (participantes.length > 0) {

        let efeitoBloqueante = effects[turnoAtual]?.some(e => e.tipo === "Atordoado" || e.tipo === "Paralisado");

        if (efeitoBloqueante) {
            adicionarHistorico(`${participantes[turnoAtual].nome} está incapacitado e perde o turno!`);
        }
            turnoAtual = (turnoAtual + 1) % participantes.length;
            aplicarEfeitos();
        
        
        atualizarLista();
    }
}

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

function resetIniciative() {
    participantes = [];
    turnoAtual = 0;
    effects = {};
    atualizarLista();
    document.getElementById("historico").innerHTML = "";
}

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