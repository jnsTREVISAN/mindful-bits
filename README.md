<div align="center">

<img src="assets/favicon.svg" width="76" alt="Ícone do Mindful Bits" />

# ✿ Mindful Bits

**um cantinho para organizar os estudos, encontrar seu foco e fazer uma pausa.**

`organização` · `foco` · `respiração`

---

*Pequenos passos também são progresso.* 🌱

</div>

## ୨୧ Sobre o projeto

O **Mindful Bits** é uma aplicação web voltada para estudantes que desejam acompanhar tarefas e prazos sem deixar de reservar um tempo para descansar. Em vez de concentrar tudo em uma única página, o site divide suas ferramentas em três espaços: **Tarefas**, **Pomodoro** e **Respiração**.

A proposta combina um painel de estudos funcional com uma interface acolhedora, cores suaves, ilustrações delicadas e navegação simples.

## ✦ Um pouquinho de cada espaço

### 01 · 📒 Tarefas — *organize seus pequenos passos*

Na página inicial (`index.html`), você pode:

- **Criar, editar, concluir e excluir tarefas**;
- Associar tarefas a **disciplinas personalizadas**;
- Definir **prazos** (opcionais);
- Consultar um resumo de tarefas **pendentes, para hoje e concluídas**;
- Alternar entre **pendentes, concluídas e todas**;
- Filtrar por **disciplina**, **hoje**, **próximos 7 dias**, **atrasadas**, **sem prazo** ou **data específica**;
- Visualizar tarefas ordenadas por prazo.

### 02 · ⏳ Pomodoro — *um momento de foco*

Em `pomodoro.html`, há um temporizador para intercalar sessões de estudo e pausas.

- Tempo inicial de **25 minutos de estudo** e **5 minutos de pausa**;
- Durações de estudo e intervalo **personalizáveis**;
- Controles para **iniciar, pausar e reiniciar**;
- Temporizador com estado preservado localmente, permitindo **trocar de página sem perder a contagem**.

### 03 · 🌼 Respiração — *desacelere por um instante*

Em `respiracao.html`, um exercício visual acompanha o ritmo respiratório:

- **4 segundos** para inspirar;
- **6 segundos** para expirar;
- **6 ciclos**, totalizando **1 minuto**;
- Animação que se expande e diminui conforme a etapa.

> ♡ O exercício é um convite para fazer uma pausa, não uma obrigação. Respire confortavelmente, sem forçar.

## 🎨 Identidade visual

A interface segue uma estética **soft, pastel e levemente whimsical**, com cartões arredondados, espaços arejados e pequenas ilustrações de jardim.

| Cor | Hexadecimal | Uso na identidade |
| :-- | :-- | :-- |
| 🪻 Lavanda | `#CDBBFF` | Destaques e botões |
| 🍃 Menta | `#9BE5C4` | Detalhes suaves |
| 🌸 Rosa | `#FFB7D5` | Cores de apoio |
| 🍮 Amarelo | `#FFE49B` | Cores de apoio |
| 🍑 Coral | `#FF9C78` | Cores de apoio |
| 🌙 Azul-escuro | `#28245C` | Textos e contraste |
| 🥛 Branco quente | `#FFFAF5` | Fundo principal |

**Tipografia:** `Nunito` nos títulos e `DM Sans` nos textos. As fontes estão incluídas na pasta `assets/`.

## 🧩 Tecnologias utilizadas

| Tecnologia | Para quê? |
| :-- | :-- |
| **HTML5** | Estrutura e conteúdo das três páginas |
| **CSS3** | Layout responsivo, componentes e animações |
| **JavaScript** | Funcionalidades das tarefas, do timer e da respiração |
| **localStorage** | Persistência de tarefas, disciplinas e temporizador no navegador |
| **SVG** | Ilustrações, ícones e favicon |

O projeto é **front-end**, sem necessidade de servidor de aplicação, banco de dados remoto ou instalação de dependências.

## 📁 Estrutura do projeto

```text
Mindful-Bits/
├── index.html              # Organização das tarefas
├── pomodoro.html           # Temporizador de estudo e pausa
├── respiracao.html         # Exercício de respiração guiada
└── assets/
    ├── styles.css          # Estilos e responsividade
    ├── app.js              # Navegação e interface compartilhada
    ├── shared.js           # Funções auxiliares
    ├── tasks.js            # Gerenciamento e filtros de tarefas
    ├── timer.js            # Lógica do Pomodoro
    ├── breathing.js        # Lógica do exercício de respiração
    ├── local-store.js      # Camada de armazenamento local
    ├── storage.html         # Apoio ao armazenamento em arquivos locais
    ├── storage-frame.js    # Comunicação do armazenamento local
    ├── garden.svg          # Ilustração do jardim
    ├── empty-garden.svg    # Ilustração de lista vazia
    ├── favicon.svg         # Ícone do site
    └── *.ttf               # Arquivos das fontes
```

## 🖥️ Como executar

1. Baixe ou clone o projeto.
2. Extraia o arquivo `.zip`, caso necessário.
3. Abra `index.html` no navegador.
4. Navegue pelas seções usando o menu lateral ou superior.

Para desenvolver, também é possível abrir a pasta no **VS Code** e usar uma extensão como o **Live Server**. Isso fornece um endereço local HTTP e tende a evitar restrições que alguns navegadores aplicam a arquivos `file://`.

> **Importante:** os dados são armazenados **no próprio navegador e dispositivo**. Eles não são sincronizados entre aparelhos. Limpar os dados do site pode apagar tarefas e configurações salvas. O armazenamento local depende das permissões e do comportamento do navegador.

## 🌿 Detalhes que fazem diferença

- **Layout responsivo**, adaptando a navegação e os cartões a telas menores;
- **Navegação por páginas**, com cada ferramenta em seu próprio espaço;
- **Estados vazios ilustrados** para uma lista de tarefas ainda sem registros;
- **Filtros e contadores** que ajudam a visualizar o planejamento;
- **Elementos de acessibilidade**, como rótulos, textos alternativos e link para pular ao conteúdo principal.

## 💌 A ideia por trás do Mindful Bits

Estudar envolve mais do que terminar uma lista de atividades. Também é preciso ter clareza sobre os prazos, encontrar momentos de concentração e permitir pequenas pausas ao longo do dia.

O **Mindful Bits** reúne essas necessidades em uma experiência simples: **planejar o que precisa ser feito, focar em uma coisa de cada vez e respirar entre uma etapa e outra.**

---

<div align="center">

**✿ Mindful Bits**

*organize • foque • respire*

Feito com carinho pelos pequenos momentos do dia. ♡

</div>
