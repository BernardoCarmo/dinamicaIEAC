# PIB, Inflação e Leilão

Aplicativo web para a dinâmica de macroeconomia em sala de aula: 6 países (líderes), 2 rodadas normais + 1 final, PIB, inflação cumulativa, cartas especiais e leilões ao vivo. O professor comanda tudo por um painel; a turma acompanha um telão com animações.

Baseado nos documentos `Especificacao_App.docx` e `Regras_do_Jogo.docx`.

## Como funciona (visão geral)

- **Líder**: abre o link no celular/notebook, digita o nome, aguarda o sorteio e joga a partir da tela do seu país.
- **Mestre (professor)**: abre o link, entra com a senha, e usa o **Painel do mestre** (`/#/painel`) para tocar a aula — sorteios, eventos, leilões, inflação, etc. Todos os cálculos são automáticos.
- **Telão**: abra `/#/telao` em uma segunda aba/janela (ou em outro notebook conectado ao projetor) para mostrar a turma as animações de cada fase da rodada.

Tudo sincroniza em tempo real via **Firebase Realtime Database**.

## 1. Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou mais recente (para desenvolver/testar localmente).
- Uma conta Google gratuita para criar o projeto Firebase.
- Uma conta GitHub para publicar o site.

## 2. Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`). Sem um `.env` configurado, o app tenta usar um Firebase real vazio e vai falhar ao sincronizar — para testar tudo localmente **sem precisar de um projeto Firebase de verdade**, use o emulador (próxima seção).

### Testando com o emulador do Firebase (recomendado antes da aula)

Isso simula o banco de dados em tempo real na sua própria máquina, sem precisar de conta ou internet.

1. Crie um arquivo `.env.local` (não precisa preencher as chaves) com:
   ```
   VITE_USE_FIREBASE_EMULATOR=true
   ```
2. Em um terminal, rode o emulador (não precisa de login):
   ```bash
   npx firebase-tools emulators:start --only database
   ```
3. Em outro terminal, rode o app:
   ```bash
   npm run dev
   ```
4. Abra várias abas: uma para `/#/painel` (senha configurada em `src/config/gameConfig.js`), uma para `/#/telao`, e algumas para `/` (entrando como líderes diferentes) — e jogue uma partida de teste inteira.

## 3. Criando seu projeto Firebase (antes da aula de verdade)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto novo (gratuito).
2. No menu lateral, vá em **Build > Realtime Database** e clique em "Criar banco de dados". Escolha qualquer região e comece em "modo de teste" (ou aplique as regras do arquivo `database.rules.json` deste projeto, que liberam leitura/escrita para qualquer um — suficiente para uma aula, mas não use para dados sensíveis).
3. Vá em **Configurações do projeto > Geral**, role até "Seus apps" e crie um app da Web (ícone `</>`).
4. Copie os valores mostrados (`apiKey`, `authDomain`, `databaseURL`, etc.) para um arquivo `.env` na raiz do projeto (use `.env.example` como modelo). Deixe `VITE_USE_FIREBASE_EMULATOR=false`.

## 4. Publicando no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser público, para a turma acessar).
2. Suba este projeto:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
   git branch -M main
   git push -u origin main
   ```
3. No repositório do GitHub, vá em **Settings > Secrets and variables > Actions** e cadastre os mesmos valores do seu `.env` como "Repository secrets": `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
4. Vá em **Settings > Pages** e em "Build and deployment > Source" escolha **GitHub Actions**.
5. Pronto: a cada `git push` na branch `main`, o workflow em `.github/workflows/deploy.yml` builda e publica o site automaticamente em `https://SEU_USUARIO.github.io/NOME_DO_REPO/`.

Compartilhe esse link com a turma — todos acessam o mesmo `/` (login). Você, como mestre, acessa `/#/painel` e projeta uma segunda aba em `/#/telao`.

## 5. Configurando a aula (antes de começar)

Edite **um único arquivo**: [`src/config/gameConfig.js`](src/config/gameConfig.js). Lá você define, com comentários explicando cada campo:

- Os 6 países reais (nome, bandeira emoji, tesouro inicial, PIB base, faixa, carta especial, etiquetas temáticas para os eventos).
- O baralho de eventos aleatórios e o que cada um afeta.
- Os prêmios físicos das 4 etapas.
- A senha do mestre (`MASTER_PASSWORD`, hoje `pringles`).
- Taxas de inflação, bônus de porte, variável de confronto da final, incremento mínimo de lance, duração do leilão.

Depois de editar, gere um novo build/push (ou rode `npm run dev` localmente) para os valores entrarem em vigor.

## 6. Decisões e limitações importantes

- **Sem autenticação real**: o "login" é só um nome (líder) ou uma senha simples (mestre) guardados no navegador. As regras do banco (`database.rules.json`) liberam leitura/escrita para qualquer pessoa com o link — adequado para uma dinâmica de sala, não para dados sensíveis.
- **O cliente do mestre é quem calcula tudo** (PIB, inflação, leilão, finalistas) e grava o resultado; os líderes só enviam nome, decisão da carta e lances. Por isso, mantenha o painel do mestre aberto e conectado durante toda a aula.
- **Apuração de finalistas em caso de empate**: as regras não cobrem o que fazer se houver empate no total apostado (ou se ninguém deu lance em nenhuma rodada). Nesses casos o painel do mestre mostra um seletor para você escolher manualmente o(s) finalista(s).
- **Leilão da final**: não tem cronômetro fixo — encerra sozinho 20s depois do último lance (ou o mestre pode clicar em "Finalizar leilão agora").
- Reinicie a partida a qualquer momento com o botão "Reiniciar jogo" no painel do mestre (útil para ensaiar antes da aula).

## Estrutura do projeto

```
src/
  config/gameConfig.js     -> única fonte de configuração (edite antes da aula)
  engine/gameEngine.js      -> regras e cálculos puros
  engine/firebaseActions.js -> ações que gravam no Firebase
  hooks/                    -> hooks de dados em tempo real e animações
  pages/                    -> Login, Sala de espera, Tela do país, Painel do mestre, Telão
  components/telao/         -> telas animadas de cada fase da rodada
  components/shared/        -> componentes reutilizáveis (contador, cronômetro, lista de lances)
```
