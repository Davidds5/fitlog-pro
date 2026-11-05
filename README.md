# 🏋️ FitLog Pro (PWA Mobile-First)

App web tátil de alta performance para controle de treinos com pirâmide de carga e diário de calorias/macronutrientes com a Tabela Nutricional TACO oficial.

Desenvolvido especialmente para ser usado na academia com uma mão só e funcionar 100% offline.

---

## 🚀 Como Rodar Localmente

1. Abra o terminal na pasta do projeto:
   ```bash
   cd C:\Users\david\Desktop\itens\dev\fitlog-pro
   ```

2. Instale as dependências (se necessário):
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O app estará disponível em: `http://localhost:3000`

4. Para rodar os testes unitários (Vitest):
   ```bash
   npm run test
   ```

---

## 📱 Como Abrir e Instalar no Celular (PWA)

1. Certifique-se de que o computador e o celular estão conectados no **mesmo Wi-Fi**.
2. No terminal do Windows, descubra o seu IP local rodando:
   ```powershell
   ipconfig
   ```
   (Procure pelo `Endereço IPv4`, exemplo: `192.168.1.15`).
3. No navegador do seu celular (Chrome ou Safari), acesse:
   ```text
   http://192.168.1.15:3000
   ```
4. **Instalar como App:**
   - **No Chrome (Android):** Toque nos 3 pontinhos no canto superior e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
   - **No Safari (iOS):** Toque no botão de compartilhar (quadrado com seta pra cima) e escolha **"Adicionar à Tela de Início"**.
5. O ícone do **FitLog Pro** aparecerá na tela do seu celular como um app nativo, abrindo em tela cheia sem barras de navegador e funcionando mesmo sem sinal de internet na academia!

---

## 🧩 Recursos Implementados (Fase 1 MVP)

- **Fichas ABC Clássicas:** Treinos A (Peito/Tríceps), B (Costas/Bíceps) e C (Pernas/Abdômen) com reordenação e exclusão.
- **Motor de Pirâmide:** Fases de Base (12-15), Pirâmide Crescente (15-12-10-8) e Pico de Força (6-8).
- **Ajustes Rápidos de Carga:** Botões táteis `[-2.5]`, `[-1]`, `[+1]`, `[+2.5]` e cálculo de 1RM instantâneo pela fórmula de Epley.
- **Cronômetro de Descanso:** 60s, 90s ou 120s com alarme sintetizado (Web Audio) e vibração no celular ao concluir a série.
- **Histórico Imediato:** Mostra a carga e repetições da última vez que o exercício foi executado.
- **Guia com 20+ Exercícios:** Dicas seguras de execução e botão para adicionar direto à ficha.
- **Diário de Calorias & Macros:** Base TACO com ~45 alimentos essenciais, cálculo de TMB (Mifflin-St Jeor), meta de proteína a 2g/kg e divisão de refeições.
