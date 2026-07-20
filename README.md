# 🎓 Fluxo Engenharia UFC - Planner

 **Fluxo Engenharia UFC** é uma plataforma web moderna, interativa e altamente visual projetada para auxiliar os estudantes de **Engenharia de Computação** da **Universidade Federal do Ceará (UFC)** no planejamento acadêmico, mapeamento de pré-requisitos, acompanhamento de progresso e simulação de semestres futuros.

---

## ✨ Funcionalidades Principais

*    **Fluxograma Interativo Inteligente (`@xyflow/react`)**: 
    Visualize o fluxo completo de disciplinas do curso através de um grafo interativo. Os nós reagem dinamicamente de acordo com o status da disciplina (Concluída, Em Curso, Disponível, Bloqueada por pré-requisitos).
*    **Importação Inteligente de Histórico (SIGAA)**: 
    Permite importar o texto copiado do seu histórico do SIGAA. O sistema processa as informações automaticamente para preencher seu progresso, notas e IRA.
*    **Dashboard de Métricas Acadêmicas**: 
    Acompanhe em tempo real estatísticas cruciais para sua graduação:
    *   **Percentual de Progresso** geral e detalhado por categoria (Obrigatórias, Optativas, Complementares).
    *   **Contagem de Créditos** integralizados.
*    **Busca Avançada de Disciplinas**: 
    Encontre disciplinas rapidamente pelo código ou nome, inspecionando ementas, carga horária, departamento e sua cadeia completa de pré-requisitos e co-requisites.
*    **Planejador de Semestres Interativo**: 
    Simule e planeje os semestres futuros de forma visual, arrastando ou selecionando disciplinas com validação em tempo real de dependências acadêmicas.
*    **Exportação de Relatórios Acadêmicos (PDF/PNG)**: 
    Gere um relatório acadêmico personalizado e diagramado em alta resolução contendo suas estatísticas, status atual de disciplinas e planejamento de semestres futuros para baixar ou imprimir diretamente pelo navegador.

---

## 🛠️ Tecnologias Utilizadas

A aplicação foi desenvolvida utilizando as melhores e mais modernas práticas do ecossistema Web:

*   **Front-end**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Construção & Build**: [Vite 6](https://vite.dev/)
*   **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) — Alta performance e estilização moderna.
*   **Visualização de Fluxos**: [XYFlow (React Flow)](https://reactflow.dev/) — Motor robusto para renderização do grafo interativo de disciplinas.
*   **Animações**: [Motion](https://motion.dev/) — Micro-interações e transições fluidas de interface.
*   **Geração de Relatórios**: [jsPDF](https://rawgit.com/MrRio/jsPDF/master/docs/index.html) & [html2canvas](https://html2canvas.hertzen.com/) — Motores de exportação com correção automática de perfis de cor modernos (`oklch`/`oklab`).

---

## 🚀 Como Executar o Projeto Localmente

Siga o passo a passo abaixo para rodar a aplicação em sua máquina de desenvolvimento:

### Pré-requisitos
Certifique-se de possuir o [Node.js](https://nodejs.org/) instalado em sua máquina (versão 18 ou superior recomendada).

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/engcomp-ufc-planner.git
cd engcomp-ufc-planner
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Executar em modo de desenvolvimento
```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:3000`.

### 4. Compilar para produção
```bash
npm run build
```
Os arquivos otimizados para produção serão gerados no diretório `/dist`.

---

## 📖 Instruções de Uso da Aplicação

### 1. Carregar seu Progresso
Você pode marcar manualmente o status de cada disciplina clicando nelas no fluxograma ou painel lateral. Contudo, a forma mais rápida é utilizando a **Importação de Histórico**:
1. Acesse o SIGAA UFC e copie o texto completo de seu Histórico Escolar em formato textual.
2. Na aplicação, clique em **"Importar Histórico"** no menu principal.
3. Cole o texto copiado no campo indicado e confirme. Pronto! Suas estatísticas e fluxograma estarão 100% sincronizados com a base da UFC.

### 2. Explorando o Fluxograma
*   **Zoom e Pan**: Use a roda do mouse para dar zoom e arraste a tela para navegar pelo fluxo.
*   **Legenda de Cores**:
    *   🟢 **Verde (Concluída)**: Disciplinas já pagas e aprovadas.
    *   🔵 **Azul (Em Curso)**: Disciplinas sendo cursadas no período atual.
    *   🟡 **Amarelo (Disponível)**: Pré-requisitos cumpridos, pronta para ser cursada.
    *   ⚪ **Cinza (Bloqueada)**: Requer alguma disciplina que você ainda não cursou.

### 3. Planejamento Semestral
Use a aba de **Planejador** para arrastar disciplinas disponíveis para semestres futuros simulados. O planejador avisará imediatamente se você tentar adicionar uma disciplina cujo pré-requisito não foi atendido em semestres anteriores.

### 4. Gerando seu Relatório Acadêmico
Ao clicar em **"Gerar Relatório"**, você terá acesso a um painel com formato folha A4 otimizado, permitindo:
*   Baixar como **PDF vetorial de alta definição**.
*   Baixar como imagem **PNG**.
*   Utilizar a ferramenta de **Impressão Nativa do Navegador** para salvar em PDF ou imprimir fisicamente, totalmente formatada sem elementos residuais de interface.

---

## 📂 Estrutura de Pastas

```text
├── src/
│   ├── components/       # Componentes React reutilizáveis (Modais, Cards, Busca)
│   ├── data/             # Base de dados estática do fluxo (disciplinas.json)
│   ├── hooks/            # Hooks customizados para gerenciamento de estados acadêmicos
│   ├── pages/            # Telas principais da aplicação
│   ├── services/         # Parsers e processadores (SIGAA Import Engine, etc.)
│   ├── types/            # Definições de tipos TypeScript do projeto
│   ├── App.tsx           # Ponto de entrada do layout e roteamento
│   ├── index.css         # Configurações globais de CSS e temas do Tailwind CSS
│   └── main.tsx          # Inicializador do React
├── index.html            # Estrutura HTML base do app
├── package.json          # Manifesto de dependências e scripts de execução
└── tsconfig.json         # Configurações do compilador TypeScript
```

---

<p align="center">
  Desenvolvido com carinho para a comunidade acadêmica de Engenharia de Computação da UFC. 🎓💻
</p>