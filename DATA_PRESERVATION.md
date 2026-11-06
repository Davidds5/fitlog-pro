# 🛡️ Diretriz Vitalícia de Governança e Preservação de Dados (FitLog Pro)

> **REGRA DE OURO OBRIGATÓRIA — VALE PARA SEMPRE NESTE PROJETO**
> 
> O David utiliza o FitLog Pro na sua rotina real de treinos e dieta. **Nenhum dado criado, editado ou registrado à mão pode ser alterado, sobrescrito, resetado ou apagado pela IA.** Esta regra tem precedência absoluta sobre qualquer solicitação de refatoração, redesign, otimização ou nova funcionalidade.

---

## 1. O que é do Usuário (Intocável)
- **Treinos e Fichas:** Nomes de fichas, letras, cores, descrições, dias de treino e organização.
- **Exercícios e Séries:** Lista de exercícios das fichas, ordem, quantidade de séries, cargas (kg), repetições e metas de pirâmide.
- **Histórico & Desempenho:** Registros de todas as séries finalizadas (`fitlog_history`), sessões completas (`fitlog_sessions`), PRs (recordes batidos) e volumes.
- **Perfil & Nutrição:** Peso corporal, altura, idade, sexo, fator de atividade, meta de calorias, refeições diárias e alimentos personalizados (`fitlog_custom_foods`).
- **Exercícios Criados:** Catálogo personalizado de exercícios (`fitlog_custom_exercises`).
- **Preferências:** Tema (claro/escuro), tipo de comparação selecionada.

---

## 2. Separação Estrita: Dados de Fábrica vs. Dados do Usuário
1. **Dados de Fábrica (`fichas.json`, `exercicios.json`, `taco.json`):**
   - São puramente **sementes iniciais** (seeds).
   - São aplicados **uma única vez**, exclusivamente quando o LocalStorage estiver completamente vazio.
   - Uma vez que o usuário possua dados, os arquivos de fábrica **nunca mais** sobrescrevem ou re-seemeiam nada automaticamente.
2. **Marcação de Propriedade:**
   - Itens criados ou editados pelo usuário recebem `origem: "usuario"` e timestamp `editadoEm: ISOString`.
   - Se o usuário editar um treino ou exercício de fábrica, ele é convertido em `"usuario"` e desvincula-se de qualquer atualização de catálogo.
3. **Catálogo de Exercícios & Alimentos:**
   - Novas versões do catálogo apenas **adicionam** novos registros. Nunca excluem nem alteram itens já existentes.

---

## 3. Protocolo de Migrações Seguras & Zero Data Loss
1. **Backup Automático Obrigatório Pré-Migração:**
   - Antes de qualquer conversão estrutural (`runSafeMigrations()`), o sistema gera automaticamente uma cópia snapshot no LocalStorage com a chave `fitlog_backup_auto_<motivo>_<timestamp>`.
2. **Princípio do Acréscimo:**
   - Novas versões de schema **só acrescentam ou convertem** campos de forma retrocompatível.
   - Nunca remover campos existentes do LocalStorage.
3. **Rollback sem Destruição:**
   - Se uma migração falhar ou o schema Zod detectar divergência, o sistema reverte para o snapshot de segurança e exibe alerta visual.
   - É terminantemente **proibido** chamar `localStorage.clear()`, `removeItem()` em chaves do usuário ou substituir dados reais por listas padrão vazias em caso de erro.
4. **Persistência do Navegador:**
   - O aplicativo solicita permissão explícita `navigator.storage.persist()` ao iniciar para impedir que navegadores mobile purguem os dados por falta de espaço em disco.

---

## 4. Proteções Ativas no Aplicativo
- **Lembrete Semanal de Backup:** Notificação visual a cada 7 dias para que o David faça o download do arquivo JSON completo (`fitlog-backup-YYYY-MM-DD.json`).
- **Backup Manual com 1 Toque:** Acesso direto na aba de Evolução/Configurações com exportação e importação resilientes.
- **Confirmação em Ações Destrutivas:** Botões de exclusão de treinos, exercícios ou histórico exigem confirmação explícita em dois passos.

---

## 5. Diretrizes Operacionais para a IA (Antigravity / Assistente)
1. **Verificação Prévia:** Antes de mexer em qualquer estrutura de storage ou migração, declare explicitamente o que será afetado em 2 linhas.
2. **Não Julgamento de Conteúdo:** Nunca troque nomes de treinos, cargas ou registros que pareçam "incomuns" ou "errados". Se tiver dúvidas, pergunte; não altere.
3. **Ambiente de Testes Isolado:** Testes unitários (Vitest/Playwright) devem sempre rodar com mocks de armazenamento ou LocalStorage limpo/isolado, **jamais** tocando nos dados reais do usuário.
4. **Checklist de Não-Regressão:** Toda entrega deve certificar que os dados preexistentes continuam 100% íntegros.
