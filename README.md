# 🏋️ FitLog Pro (PWA Mobile-First)

App web tátil de alta performance para controle de treinos com progressão de carga (pirâmide, base e pico de força) e diário de calorias/macronutrientes integrado à Tabela Nutricional TACO oficial.

Desenvolvido especialmente para ser usado na academia com uma mão só, com microinterações físicas táteis (padrão Clovin Tátil) e funcionamento 100% offline.

---

## 📱 Instalação Rápida no Celular (3 Passos)

1. Acesse o link do app no navegador do celular (Chrome no Android ou Safari no iPhone).
2. Toque no menu do navegador (**Compartilhar** no Safari ou **⋮ Menu** no Chrome).
3. Selecione **"Adicionar à Tela de Início"** (ou "Instalar Aplicativo") para ter o app em tela cheia com ícone nativo e suporte offline.

---

## 🚀 Como Rodar Localmente

1. Abra o terminal na pasta do projeto:
   ```bash
   cd C:\Users\david\Desktop\itens\dev\fitlog-pro
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:3000`

4. Para rodar a suíte de testes unitários:
   ```bash
   npm run test
   ```

---

## 🛡️ Segurança & Arquitetura
- **Validação com Zod Schemas:** Todos os registros em `localStorage` são validados e sanitizados em runtime, restaurando fallbacks seguros em caso de corrupção ou adulteração de dados.
- **Cabeçalhos HTTP Hardened:** Proteção contra clickjacking (`X-Frame-Options: DENY`), MIME sniffing (`X-Content-Type-Options: nosniff`), HSTS ativado e CSP restrito.
- **PWA v1.1:** Service Worker com cache exclusivo de recursos estáticos da aplicação e suporte total a modo offline na academia.
- **Zero Vulnerabilidades:** Dependências de produção auditadas via `npm audit --omit=dev`.

Para detalhes completos da auditoria, consulte o [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

---

## 🧩 Recursos do FitLog Pro

- **Treinos 100% Personalizáveis:** Crie planos livres, adicione/reordene exercícios, defina dias da semana ou aplique templates prontos (ABC, ABCD, ABCDE, Push/Pull/Legs, Upper/Lower, Full Body).
- **Motor de Pirâmide & Carga:** Sugestões automáticas por fase (Base, Pirâmide e Pico) e cálculo de 1RM pela fórmula de Epley.
- **Controles Táteis Ergonômicos:** Botões táteis com área de toque ≥ 48px para peso e repetições (`±1kg`, `±2.5kg`), além de digitação direta.
- **Cronômetro de Descanso:** 60s, 90s ou 120s com contagem regressiva flutuante.
- **Guia de Exercícios Anatômico:** Filtro por grupo muscular, subgrupos, dicas de execução e criação de exercícios personalizados.
- **Diário de Calorias & Macros (TACO):** Cálculo de TMB (Mifflin-St Jeor), metas automáticas de proteína (2g/kg), gordura e carboidrato com busca instantânea de alimentos.
