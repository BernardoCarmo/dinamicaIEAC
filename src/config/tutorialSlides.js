// ============================================================================
// CONTEÚDO DO TUTORIAL — a sequência de slides explicando o jogo inteiro.
// Cada slide tem: título, "visual" (chave usada por TutorialSlide.jsx pra
// escolher a ilustração), bullets (o que aparece na tela pra todo mundo) e
// script (o roteiro de fala — só aparece no painel do mestre).
// ============================================================================
import {
  TIER_BONUS,
  INFLATION_RATES,
  MIN_BID_INCREMENT,
  BID_COOLDOWN_MS,
  MAX_PRELIMINARY_WINS,
  FIXED_BET_UNTIL_REMAINING_SEC,
  NEW_BIDS_FROM_REMAINING_SEC,
  VALUES_REVEAL_FROM_REMAINING_SEC,
  SABOTAGE_COST_PERCENT,
  SABOTAGE_GDP_CUT_PERCENT,
  STEAL_GDP_PERCENT,
  STEAL_ATTACKER_PENALTY,
  NON_WINNER_INFLATION_EXTRA,
  SECOND_PLACE_INFLATION_EXTRA,
} from "./gameConfig";

const pct = (v) => Math.round(v * 100);

export const TUTORIAL_SLIDES = [
  {
    id: "intro",
    title: "Bem-vindo(a) à dinâmica de PIB, Inflação e Leilão",
    visual: "flags",
    bullets: [
      "6 países disputam 3 rodadas normais + 1 grande final.",
      "Existem 2 campeões possíveis: quem vencer a Final e quem terminar com mais dinheiro guardado (Riqueza Real).",
      "Dá pra jogar bem de mais de um jeito: arriscando nos leilões, ou administrando o dinheiro com cautela.",
    ],
    script:
      "Hoje vamos simular uma economia global em miniatura. Seis países vão crescer, sofrer inflação e disputar leilões ao vivo por prêmios reais. Existem dois campeões possíveis: quem vencer a grande final, e quem terminar com mais dinheiro guardado, mesmo sem chegar lá. Ou seja, tem mais de um jeito de jogar bem — vale a pena arriscar tudo nos leilões, ou jogar mais conservador. Vamos ver como tudo isso funciona.",
  },
  {
    id: "roles",
    title: "Dois papéis: Líder e Mestre",
    visual: "roles",
    bullets: [
      "Líder: controla um país pelo celular ou notebook, só vê os dados do seu próprio país.",
      "Mestre: comanda o andamento de todas as rodadas e projeta o telão pra turma.",
      "Todos os cálculos são automáticos — ninguém precisa fazer conta.",
    ],
    script:
      "Cada um de vocês vai controlar um país pelo próprio celular ou notebook. Eu, como mestre, controlo o ritmo do jogo por este painel, e todo mundo acompanha as animações no telão projetado. Nenhum cálculo é feito na mão — o aplicativo cuida de tudo automaticamente.",
  },
  {
    id: "tiers",
    title: "Três portes de país",
    visual: "tiers",
    bullets: [
      `Grande: tesouro inicial 3000, +${pct(TIER_BONUS.grande)}% de bônus de PIB por rodada.`,
      `Médio: tesouro inicial 2500, +${pct(TIER_BONUS.medio)}% de bônus de PIB por rodada.`,
      `Pequeno: tesouro inicial 2000, +${pct(TIER_BONUS.pequeno)}% de bônus de PIB por rodada.`,
    ],
    script:
      "Os países não começam iguais. Os grandes têm mais dinheiro guardado no início, mas crescem mais devagar a cada rodada. Os pequenos começam com menos, mas o bônus de crescimento deles é bem maior — isso ajuda a equilibrar a disputa ao longo do jogo.",
  },
  {
    id: "structure",
    title: "Estrutura da partida",
    visual: "structure",
    bullets: [
      "Rodada 1, Rodada 2 e Rodada 3: todos os 6 países disputam juntos.",
      "Final: só os 2 países classificados se enfrentam diretamente.",
      "As 4 rodadas seguem sempre o mesmo ciclo de passos.",
    ],
    script:
      "São 4 leilões no total: três rodadas normais, valendo pra todo mundo, e uma final entre só os dois melhores colocados. O ciclo dentro de cada rodada é sempre o mesmo — vou mostrar agora, passo a passo.",
  },
  {
    id: "cycle",
    title: "O ciclo de uma rodada",
    visual: "cycle",
    bullets: [
      "Evento → Pergunta sobre cartas → Crédito de PIB → Bastidores do leilão",
      "→ Leilão ao vivo → Resultado → Inflação → Ranking",
      "Esse ciclo se repete em todas as 4 rodadas, inclusive a final.",
    ],
    script:
      "Toda rodada segue exatamente essa sequência de 8 passos. Vou detalhar cada uma dessas etapas nos próximos slides, uma de cada vez.",
  },
  {
    id: "event",
    title: "Passo 1 — Evento aleatório",
    visual: "event",
    bullets: [
      "Sorteado a cada rodada: pode afetar todos os países, só quem tem uma etiqueta temática, um país ao acaso, ou nenhum.",
      "Alguns eventos também aumentam a inflação daquela rodada.",
    ],
    script:
      "No início de cada rodada eu sorteio um evento — pode ser um boom de commodities, uma guerra regional, uma inovação tecnológica, e por aí vai. Alguns eventos também deixam a inflação daquela rodada mais alta pra todo mundo.",
  },
  {
    id: "cards_overview",
    title: "Passo 2 — Cartas especiais",
    visual: "cards_overview",
    bullets: [
      "Cada país já tem 1 ou 2 cartas fixas — não são sorteadas.",
      "Cada carta só pode ser usada 1 vez em todo o jogo.",
      "Só dá pra decidir usar quando o mestre perguntar, antes do leilão daquela rodada.",
    ],
    script:
      "Cada país já tem sua carta guardada desde o início — vocês já viram a sua na tela do país, em segredo. Vocês só decidem SE e QUANDO usá-la, sempre que eu perguntar, antes do leilão de alguma rodada. É de uso único: depois de usar, ela some.",
  },
  {
    id: "cards_detail",
    title: "O que cada carta faz",
    visual: "cards_detail",
    bullets: [
      "Países grandes: Porto Seguro Cambial — zera a inflação da rodada em que for usada.",
      "Países médios: Investimento Estrangeiro Direto — +500 moedas na hora.",
      "Países pequenos: um bônus fixo (+900 moedas) e uma carta de ataque única.",
    ],
    script:
      "As cartas dos países grandes protegem contra a inflação. As dos médios, e uma das dos pequenos, dão dinheiro na hora, assim que usadas. E cada país pequeno também tem uma carta de ataque — essas são especiais, vou explicar em detalhe agora.",
  },
  {
    id: "attack_cards",
    title: "Cartas de ataque: Sabotagem e Roubo de PIB",
    visual: "attack_cards",
    bullets: [
      `Sabotagem de PIB (Chile): paga ${pct(SABOTAGE_COST_PERCENT)}% do próprio saldo, corta ${pct(
        SABOTAGE_GDP_CUT_PERCENT
      )}% do PIB de um país GRANDE sorteado ao acaso.`,
      `Roubo de PIB (Portugal): rouba ${pct(STEAL_GDP_PERCENT)}% do PIB de um país ESCOLHIDO por ele, custa ${STEAL_ATTACKER_PENALTY} de PIB próprio.`,
      "O efeito já entra no saldo na hora, mas quem atacou fica em segredo até pouco antes do leilão daquela rodada.",
    ],
    script:
      "Duas cartas mexem direto com o país adversário. O Chile pode sabotar — sempre um país grande, sorteado, nunca escolhido por ele. Portugal pode roubar — aí ele escolhe o alvo. As duas custam caro pra quem ataca, e o efeito já é aplicado no saldo na mesma hora, pra já valer nas negociações do leilão. Mas quem foi o atacante só é revelado pouco antes do leilão daquela rodada, no telão — pra manter o suspense.",
  },
  {
    id: "auction_stage1",
    title: "Passo 4 — Leilão, fase 1: aposta fixa",
    visual: "auction_stage1",
    bullets: [
      `Primeiros segundos (até faltar ${FIXED_BET_UNTIL_REMAINING_SEC}s): cada país pode dar 1 único lance secreto.`,
      "Ninguém vê o valor dos outros nessa fase — é uma aposta às cegas, simultânea.",
    ],
    script:
      "O leilão começa com uma aposta às cegas: cada um pode dar um único lance nos primeiros segundos, sem ver o que os outros estão apostando. É a hora de arriscar um valor inicial sem saber a concorrência.",
  },
  {
    id: "auction_stage2",
    title: "Passo 4 — Leilão, fase 2: travado",
    visual: "auction_stage2",
    bullets: [
      `Entre ${FIXED_BET_UNTIL_REMAINING_SEC}s e ${NEW_BIDS_FROM_REMAINING_SEC}s restantes: ninguém pode dar lance.`,
      "É só um tempo de espera antes da reta final abrir.",
    ],
    script:
      "Depois da aposta fixa, tudo trava por alguns segundos. Ninguém pode mexer em nada — é só aguardar a próxima fase abrir. Aproveitem esse tempo pra pensar na estratégia.",
  },
  {
    id: "auction_stage3",
    title: "Passo 4 — Leilão, fase 3: novos lances e revelação",
    visual: "auction_stage3",
    bullets: [
      `Últimos ${NEW_BIDS_FROM_REMAINING_SEC}s: libera dar novos lances (precisa superar o maior lance atual).`,
      `Últimos ${VALUES_REVEAL_FROM_REMAINING_SEC}s: os valores dos lances ficam visíveis pra todo mundo.`,
    ],
    script:
      "Na reta final, todo mundo pode voltar a dar lances — cada novo lance precisa superar o maior lance já feito. E só nos segundos finais os valores aparecem pra todo mundo ver, o que deixa tudo bem mais emocionante até o último instante.",
  },
  {
    id: "auction_rules",
    title: "Regras fixas do leilão",
    visual: "auction_rules",
    bullets: [
      `Incremento mínimo: cada novo lance precisa superar o atual em pelo menos ${MIN_BID_INCREMENT} moedas.`,
      "Ninguém pode apostar mais dinheiro do que realmente tem.",
      `Espera de ${Math.round(BID_COOLDOWN_MS / 1000)} segundo entre um lance e outro do mesmo país.`,
      "Só quem vence paga o valor do lance — quem perde não paga nada. Sem lances, ninguém leva o prêmio.",
    ],
    script:
      "Algumas regras valem pra todo leilão: o lance mínimo sempre sobe um valor fixo; ninguém pode apostar mais dinheiro do que tem; e existe um segundo de intervalo obrigatório entre um lance e outro do mesmo país, só pra evitar clique repetido. E lembrando: só quem vence paga o que apostou.",
  },
  {
    id: "win_cap",
    title: "Limite de vitórias",
    visual: "win_cap",
    bullets: [
      `Nenhum país pode vencer mais de ${MAX_PRELIMINARY_WINS} rodadas normais.`,
      "Ao bater esse limite, o país já garante vaga na final — e fica proibido de dar lances nas rodadas normais seguintes.",
    ],
    script:
      "Pra não ficar repetitivo, nenhum país pode vencer mais de duas rodadas normais. Assim que isso acontece, esse país já está garantido na final, e a partir daí ele não participa mais dos leilões das rodadas normais restantes — só observa.",
  },
  {
    id: "inflation",
    title: "Passo 6 — Inflação da rodada",
    visual: "inflation",
    bullets: [
      `Taxas base sobem a cada rodada: ${INFLATION_RATES.r1}%, ${INFLATION_RATES.r2}%, ${INFLATION_RATES.r3}%, e ${INFLATION_RATES.final}% na final.`,
      "Quem venceu o leilão não paga nada a mais.",
      `Quem ficou em 2º no lance (arriscou e não levou) paga +${SECOND_PLACE_INFLATION_EXTRA} pontos percentuais.`,
      `Os demais países pagam +${NON_WINNER_INFLATION_EXTRA} ponto percentual a mais.`,
    ],
    script:
      "A inflação corrói o saldo de todo mundo a cada rodada, inclusive de quem já não disputa mais leilão. Mas ela pune mais quem arriscou e não levou: o vencedor não paga nada extra, quem ficou em segundo no lance paga bem mais, e os demais pagam só um pouco a mais. Quem usou a carta de imunidade não paga nada, é claro.",
  },
  {
    id: "ranking",
    title: "Passo 7 — Ranking da rodada",
    visual: "ranking",
    bullets: [
      "O telão mostra quem subiu e quem desceu — sem revelar os valores em dinheiro.",
      "Na Rodada 3, nem a ordem aparece: só o anúncio dos finalistas depois.",
    ],
    script:
      "Depois da inflação, o telão mostra a reordenação do ranking — mas sem contar os valores, pra manter o mistério até o fim do jogo. Na Rodada 3 nem isso aparece: vocês só vão saber quem chegou na final, sem nenhuma pista de quem está rico ou não.",
  },
  {
    id: "finalists",
    title: "Como são escolhidos os finalistas",
    visual: "finalists",
    bullets: [
      "Sempre automático — o mestre nunca escolhe manualmente.",
      "Critério em cascata: 1) mais vitórias em leilão, 2) mais dinheiro apostado no total, 3) maior saldo atual, 4) sorteio.",
    ],
    script:
      "A escolha dos dois finalistas é sempre automática. Primeiro olha quem venceu mais leilões nas rodadas normais. Se empatar, olha quem apostou mais dinheiro no total, ganhando ou perdendo. Se ainda empatar, quem tem mais saldo guardado. E em último caso, sorteio.",
  },
  {
    id: "final_round",
    title: "A grande final",
    visual: "final_round",
    bullets: [
      "Tela de confronto: as bandeiras dos 2 finalistas, frente a frente.",
      "Variável de equilíbrio ajuda o finalista de porte mais fraco, conforme a diferença de faixa.",
      "Só os 2 finalistas dão lance; os outros 4 continuam recebendo PIB e inflação pro placar de Riqueza Real.",
    ],
    script:
      "A final começa com um confronto direto na tela: as bandeiras dos dois finalistas, uma de cada lado. Como eles podem ter portes diferentes, existe uma variável de equilíbrio que favorece o mais fraco. O resto do ciclo é igual ao das rodadas normais, mas só os dois finalistas disputam o leilão — os outros quatro países seguem recebendo PIB e inflação normalmente, continuando na disputa pelo placar de Riqueza Real.",
  },
  {
    id: "prizes_ending",
    title: "Prêmios e o encerramento",
    visual: "prizes_ending",
    bullets: [
      "5 prêmios configuráveis: Rodada 1, Rodada 2, Rodada 3, Final e Riqueza Real.",
      "2 placares finais: Campeão da Final e Campeão de Riqueza Real, com o ranking completo revelado.",
    ],
    script:
      "No final da aula, teremos dois vencedores revelados de vez: quem ganhou a grande final, levando o grande prêmio, e quem terminou com mais dinheiro guardado no total — mesmo que não tenha chegado à decisão. É só aí que todos os saldos são finalmente revelados pra turma toda.",
  },
  {
    id: "ready",
    title: "Vamos começar!",
    visual: "ready",
    bullets: [
      "Alguma dúvida? Perguntem agora antes de começar.",
      "Ao fechar este tutorial, o sorteio dos países será liberado.",
    ],
    script:
      "Alguma dúvida antes de começarmos de verdade? Assim que eu fechar esse tutorial, vou liberar o sorteio dos países pra cada um de vocês. Boa sorte!",
  },
];
