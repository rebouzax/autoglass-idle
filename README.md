# Autoglass Inc.

Jogo idle 3D com Three.js, Vite e MVVM. Progresso e preferências salvos no navegador.

## Executar

Na pasta `C:\projetos\webjogos\autoglass`:

```sh
npm install
npm run dev
npm run build
```

`npm run build` gera a versão de produção em `dist`. `npm run preview` abre essa versão localmente.

## Empresa em 16 etapas

| Nível | Empresa | Nova operação |
| --- | --- | --- |
| 1 | Garagem de bairro | 1 técnico, 1 caixa e 1 box; trocas de vidro automáticas |
| 2 | Loja e recebimento | 4 boxes, produtos para carros e motos, coletores no CL e retiradas |
| 3 | Centro logístico | Mais boxes e técnicos, ampliação da oficina e do estoque endereçado; outdoor Autoglass |
| 4 | Sede comercial | Vendedores, reuniões, encomendas e expedição |
| 5 | Hub de expedição | Duas docas para caminhões e escritório maior |
| 6 | Comércio digital | TI, desenvolvedores, servidores e loja online |
| 7 | Rede de filiais | Palhetas, faróis LED, sensores ADAS, dados, segurança e integração da rede |
| 8 | Frotas corporativas | Contratos de fornecimento para frotas e centro de educação |
| 9 | Distribuição regional | Três docas e distribuição de lotes |
| 10 | Central de seguros | Seguradoras e robôs de reposição pelo WMS |
| 11 | Marketplace nacional | Outro canal de vendas digitais |
| 12 | Operação automatizada | Automação e produtividade de logística |
| 13 | Expansão internacional | Quatro docas e exportação |
| 14 | Polo industrial | Fabricação de vidros, controle de qualidade e coleta pelo CL |
| 15 | Grupo Autoglass | Terminal de encomendas aéreas, aviões cargueiros e integração do grupo |
| 16 | Comércio mundial | Mar, porto, navios, contêineres e rotas mundiais |

A empresa pode contratar **500 funcionários** no nível 16: **120 técnicos, 24 caixas, 136 coletores, 100 vendedores, 80 desenvolvedores e 40 operadores de fábrica**. Os limites aumentam ao longo das 16 etapas. Contrate 1, 5 ou 10 pessoas por compra; o preço e a quantidade respeitam o saldo e o limite da etapa. Novas estações ficam no campus de apoio a partir do nível 3. Técnicos preparam produtos, coletores conferem pacotes, vendedores fazem contatos e desenvolvedores trabalham em estações próprias. Cada contratação adicional melhora o ritmo do setor correspondente.

A loja chega a 12 boxes. Os personagens que percorrem portas e corredores são limitados à capacidade física de cada setor; as demais equipes trabalham e são animadas em células individuais no campus. Isso mantém as passagens livres e reduz o custo de simular mais de 200 pessoas. **Operação → Equipe** informa o total, as vagas por setor, os funcionários na operação e no apoio, seus efeitos e um botão para localizar as equipes. O CL possui até 72 endereços e 864 itens. **Requisitos** apresenta as compras e metas da próxima ampliação; listas compridas têm páginas, sem rolagem.

Os contratos corporativos crescem em lotes. A operação visível separa volumes representativos, enquanto o pedido informa sua quantidade comercial e o valor total. Isso permite faturamento bilionário nos níveis finais com uma quantidade limitada de personagens na tela. A receita de um contrato entra quando a encomenda é carregada e expedida; a tela **Operação → Empresa** separa o faturamento por canal.

### Atendimento, CL e encomendas

Clientes chegam de carro ou moto, saem sem carregar produtos, entram na sala de espera e sentam. O técnico se levanta do banco ao lado das gavetas azuis, busca o produto e faz a instalação. O cliente paga no caixa depois do serviço, com um efeito de confirmação do pagamento. Demora pode gerar reclamações. Vidros, retrovisores de carros, retrovisores de motos e peças têm preços, duração, produtos e animações próprios.

O CL começa no nível 2. Caminhões levam pacotes de quatro itens para docas reservadas. Coletores retiram as caixas, leem o código e armazenam em endereços disponíveis. O manifesto prioriza produtos com menos estoque. Cada coletor tem uma estação e os endereços não são compartilhados durante uma tarefa. Técnicos repõem a área de venda quando o estoque fica baixo. No primeiro nível, a reposição é local e automática.

Ligações e reuniões do escritório geram encomendas. Desde o nível 6, os desenvolvedores programam, publicam melhorias no site e geram pedidos online. Técnicos separam os produtos, embalam e entregam para veículos de expedição. Os entregadores só são chamados quando a embalagem está pronta. Computadores, cadeiras, treinamento, embalagem, servidores e marketing têm efeitos na operação. Os canais empresariais dos níveis 7–16 entram nas ligações de venda e nos lotes de encomendas.

### Navegação

A movimentação usa um grafo de salas, A* com índice espacial, colisões circulares, reservas de estações, filas nas portas, áreas de espera fora da passagem e desvio quando um personagem para de avançar. As rotas interiores ficam dentro das salas. Carros, motos e caminhões usam caixas orientadas, aceleração, desaceleração e curvas suaves. Manobras têm prioridade local; docas utilizam uma faixa de acesso separada dos caminhões estacionados. Ampliações de área aguardam veículos em manobra. Quando a próxima etapa está pronta para compra, há pequenas janelas de expedição para permitir a construção.

## Controles

- Computador: arraste o cenário com o mouse; roda ou botões para zoom.
- Smartphone e tablet: arraste com um dedo; pinça com dois dedos para zoom. Nenhum joystick aparece na tela. Smartphones ocultam os botões de zoom e centralização em ambas as orientações; tablets e computadores mantêm esses botões.
- Centralizar enquadra o terreno atual; os botões de câmera permitem explorar detalhes.
- Melhorias têm abas Loja, CL, Escritório, TI e Rede. Painéis recolhíveis e páginas evitam rolagem.
- Escape pausa ou fecha o painel aberto. A interface acompanha a orientação e as áreas seguras.

A logo PNG fornecida está no menu, na fachada, nos caminhões e no outdoor a partir do nível 3. Os ícones da interface são SVGs. O cenário e os personagens são modelos low-poly procedurais.

## Tutorial, áudio e clima

Fernando Carreira é o personagem fundador solicitado para guiar a primeira partida. O tutorial apresenta três demonstrações animadas na garagem do nível 1: atendimento, compra de ferramenta e metas para a primeira ampliação. Os botões executam ações numa economia isolada, sem gastar dinheiro da partida. A simulação real fica pausada; Voltar, Próximo e Pular estão disponíveis. Pode ser reaberto em **Configuração → Jogo → Como jogar**. Saves anteriores continuam com seu progresso.

**Sunlight on the Counter** toca durante o gameplay em loop de **00:00 a 02:31**. O volume começa em 18%; ajuste ou silencie em **Configuração → Áudio**. Menu, pausa e aba oculta suspendem a reprodução. A música começa após interação do jogador.

Chuva e tempestade ocasionais duram **6 a 9 minutos de jogo ativo**, com poças, iluminação e clarões. Veículos ficam até 18% mais lentos. Partículas marcam serviço, pagamento, entrega, publicação do site e melhorias.

## GitHub Pages

1. Envie esta pasta para o repositório, incluindo `package-lock.json` e `.github/workflows/pages.yml`.
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
3. Faça um push na branch padrão ou execute **Publicar Autoglass no GitHub Pages** em Actions.

O workflow compila e publica `dist`, com o caminho do repositório definido pelo Pages. Os assets são locais e relativos, inclusive logo e música.

## Organização

- `src/models`: economia, progressão, navegação, tráfego, atendimento, CL, escritório e TI.
- `src/models/ShopLayout.js`: coordenadas compartilhadas entre física e renderização.
- `src/viewmodels`: ações do jogador e ciclo da aplicação.
- `src/views`: interface, cidade, modelos, efeitos e decoração da empresa.
- `src/services`: câmera, áudio e preferências.

## Evolução do campus e da cidade

Em **Operação → Evolução**, acompanhe as 16 etapas, as operações liberadas e as mudanças na cidade. Casas dão lugar a comércio, prédios e um distrito empresarial, com mais pedestres e veículos. Os nomes de setores foram removidos do cenário; marcas, móveis, pisos e equipamentos identificam as áreas.

- **Nível 8:** centro de educação com professor, aulas, estação de prática e certificação. Formações e currículo aumentam o ritmo de técnicos, CL, vendedores e TI, até 50%.
- **Nível 14:** linhas de corte, têmpera e qualidade produzem vidros. Coletores retiram a produção, conferem, endereçam e abastecem a loja pelo fluxo existente. O buffer cheio pausa a produção até a próxima coleta.
- **Nível 15:** grupo empresarial com campus, fábrica, sede, comércio digital, quatro docas e contratos de grande volume. Continue investindo nas equipes e operações.

O painel **WMS** mostra ocupação dos endereços e as últimas 40 movimentações: recebimento, conferência, endereçamento, reposição, separação, embalagem, produção e expedição. Coletores fazem inventários físicos quando disponíveis. Os grandes contratos representam a rede por lotes; as caixas na cena representam os volumes locais de cada pedido.

Em **Operação → Empresa**, os botões de educação e fábrica aproximam a câmera dessas áreas. Mouse, toque e pinça continuam funcionando sem controle virtual visível.

## Compilação local

`npm run build` gera a versão para GitHub Pages.

### Desempenho e primeira ampliação

Em **Configuração → Jogo → Qualidade gráfica**, escolha Automática, Leve, Equilibrada ou Alta. O perfil automático começa leve em smartphones e ajusta resolução, sombras e efeitos ao tempo dos quadros. As equipes adicionais usam desenho por instâncias, animações locais e estações reservadas; as construções estáticas são agrupadas. A simulação usa passos de 1/30 s e a renderização respeita o perfil de qualidade. A aba oculta suspende a atualização visual e a simulação. O desempenho real depende do aparelho e do navegador.

A compra do nível 2 com R$ 600 e os requisitos completos não depende das reservas de manobra usadas nas ampliações posteriores. Reiniciar o progresso também limpa os bloqueios transitórios de construção.

## Prévias locais

Em desenvolvimento, `/?preview=1` até `/?preview=16` abre cada etapa com uma economia isolada, sem ler ou alterar o save real. `/?preview=1&tutorial=1` apresenta o tutorial. Acrescente `&weather=rain` ou `&weather=storm` para apresentar o clima, `&staff=full` para preencher as vagas da etapa, `&device=phone` para visualizar os controles de smartphone ou `&expansion=ready` na etapa 1 para apresentar a compra com R$ 600 e as metas completas. Esses atalhos não estão ativos no build de produção.

## Tecnologia e transporte mundial

Divisórias acústicas, monitores, TVs, quadros, tablets, ferramentas, terminais WMS e racks de servidores aparecem conforme os equipamentos e níveis comprados. As divisórias e móveis que ocupam corredores também entram nos obstáculos de navegação. Os nomes de setores permanecem fora do cenário.

A partir do nível 7, palhetas, faróis LED e sensores ADAS passam pelo catálogo, lojas online, pedidos, coleta, endereçamento e embalagem. As linhas adicionais de fábrica montam esses produtos; a primeira mantém os vidros. O centro de educação tem amostras e prática com o catálogo. Produtos que compartilham uma bancada usam a mesma reserva de atendimento.

Segurança digital acelera publicações e melhora vendas; inteligência de dados aumenta o ritmo comercial e online; nuvem melhora desenvolvimento e venda; integração das filiais amplia o ritmo e o volume dos contratos. As publicações aparecem em **Operação → Empresa**.

O nível 10 inclui um robô WMS e permite comprar até seis. Cada robô reserva estoque de um endereço, transporta o pacote por uma faixa exclusiva e repõe a loja. O WMS registra a movimentação e o contador informa os itens entregues. Transferências interrompidas são recuperadas ao carregar a partida.

No nível 15, encomendas aéreas e, no nível 16, marítimas passam pela separação e embalagem existentes. Apenas pedidos embalados entram no terminal reservado. Carregamento, partida e conclusão são animados; a receita entra ao concluir o transporte. Melhorias aumentam a frequência e a quantidade de pedidos por viagem, exibem aeronaves/navios adicionais estacionados e ampliam os lotes comerciais. O visual representa o terminal local; o volume de milhões de unidades continua representado por lotes.

A ampliação do nível 15 para 16 custa R$48 bilhões, exige investimentos em grupo, carga aérea, robôs, rede e nuvem e 1.200 encomendas entregues. As contratações máximas chegam a 500 no nível 16. A câmera pode explorar o aeroporto e o mar; **Operação → Empresa** tem atalhos para robôs, TI, fábrica, educação, aeroporto e porto.


## Rotas de carga e equipe mundial

A cidade ganha área e avenidas mais largas a partir do nível 6. Vagas de visitantes ficam ao lado da loja, sem ocupar a porta; a expedição cresce até cinco vagas com melhorias. A equipe atinge 500 vagas compráveis no nível 16: 120 técnicos, 24 caixas, 136 coletores, 100 vendedores, 80 desenvolvedores e 40 operadores. Equipes adicionais continuam usando instâncias e produção de apoio.

Encomendas embaladas são carregadas em caminhões da empresa e seguem por vias de acesso ao aeroporto e ao porto. Operadores descarregam; o carregador aéreo e o guindaste embarcam a carga. Aviões decolam, fazem uma volta por trás da pista e descem; navios cruzam sob a ponte elevada e regressam pela mesma rota. A receita é creditada uma vez na conclusão da entrega; o terminal aguarda o retorno antes de liberar outra viagem.

Fernando Carreira apresenta três passos animados, todos na garagem do nível 1: atendimento, compra de ferramenta e metas para ampliar. A demonstração usa economia isolada e não modifica o progresso do jogador.


## Campus amplo e circulação nos níveis altos

Os boxes têm 5,2 m de espaçamento; a circulação do CL e os postos de conferência são separados. O limite operacional sobe gradualmente de 24 coletores no nível 7 para 96 no nível 16, dentro das 136 vagas de CL compráveis. As equipes de apoio continuam trabalhando nas conferências locais e acelerando a operação. O total de contratação permanece em 500.

A partir do nível 7, o escritório, o terreno, o CL e os pavilhões de apoio crescem. Duas torres abrigam vendedores e desenvolvedores em pavimentos de trabalho com computadores e animações locais. São dois pavimentos de trabalho no nível 7 e seis no nível 16, além do térreo. Os coletores e clientes circulam no térreo; os funcionários dos andares alternam tarefas nas estações e bancadas, com acesso vertical durante as trocas de turno.

Portas internas possuem reservas independentes para os dois sentidos. Pontos de espera ficam fora da passagem. A navegação reaproveita o mapa quando paredes e veículos não mudaram, evitando recalcular os mesmos obstáculos em cada quadro.

O WMS preserva os 36 endereços originais e acrescenta outros 36 nas expansões. Nos níveis altos, cada doca pode receber três coletores em pontos separados, e até doze inventários físicos podem ocorrer simultaneamente. O recebimento continua passando por coleta, conferência e endereçamento reais.

## Equipes de 500 pessoas
As vagas crescem a partir do nível 3, respeitando o desbloqueio de cada setor. O CL tem até 96 coletores na circulação; os demais funcionários atuam em postos de apoio animados e aceleram suas equipes. Escritório e TI permitem até 12 funcionários na operação com os investimentos em computadores. Estações extras recebem divisórias e monitores. As colisões de pedestres usam vizinhanças espaciais atualizadas após cada movimento; destinos ocupados são reavaliados, e reservas de atores removidos são liberadas. Clientes irritados e os que esperam há mais tempo têm prioridade no próximo serviço. Os efeitos de leitura, venda, contrato e entrega usam pools de instâncias com limites fixos.

As mesas do escritório ficam afastadas da passagem da loja, mantendo uma faixa livre para encomendas, retornos e transferências da fábrica ao CL.

## Turnos, deslocamentos e postos de apoio
O relógio avança dois minutos por segundo de jogo: um ciclo de 24 horas dura aproximadamente 12 minutos. A loja abre das 07:00 às 19:00 e conclui os atendimentos iniciados antes do fechamento. À noite, o CL e a expedição continuam com os funcionários escalados para esse turno. Novos clientes, telefonemas comerciais, desenvolvimento e produção industrial aguardam o dia seguinte.
As equipes têm identidades e escalas fixas, casas compartilhadas por dois funcionários e transporte próprio (carro, moto ou caminhada). O estacionamento de funcionários cresce com a capacidade da etapa; as entradas e saídas são escalonadas. Pedestres usam corredores de ida e volta e os veículos compartilham as colisões e prioridades com o trânsito. Os andares possuem acesso pelo elevador.
Os postos de apoio executam percursos entre mesa e bancada: separam e embalam encomendas reais, criam pedidos por telefone ou pelo site, produzem itens da fábrica e faturam acessórios consumidos do estoque. Uma encomenda só gera receita quando entregue; acessórios preparados pela equipe técnica ficam na fila de faturamento, que os caixas confirmam durante o dia. A tela Equipe mostra a presença no turno e a receita atribuída a cada setor a partir das vendas reais, sem somar essa atribuição novamente ao caixa. Iluminação, céu e luminárias acompanham o horário. As equipes de apoio e os veículos de funcionários usam instâncias para limitar as chamadas de desenho.
Prévia isolada de desenvolvimento: `?preview=16&staff=full&hour=18.9` começa antes da troca de turno; `hour=6.8` começa antes da abertura. Essas prévias não usam o progresso salvo do jogador.

## Rotina corporativa e controles noturnos
Durante a noite aparecem 2× (acelera somente o relógio) e Amanhecer (07:00). Pular a noite não concede receita por horas não simuladas. A equipe diurna retorna aos postos; operações noturnas já iniciadas terminam antes de liberar seus funcionários e reservas.
Refeitórios, bebedouros, convivência com TV, banheiros, vestiários, academia, salas de reunião, foco e rede crescem junto dos pavilhões. As pausas possuem vagas reservadas, rotas de ida e volta e benefício de 12% por 120 segundos nas tarefas de apoio. Alguns funcionários usam a academia no começo da noite; fábrica e educação podem passar pelo banho antes de ir embora. Cabines ocupadas preservam a privacidade dos personagens.
Vendedores fazem reuniões que originam encomendas maiores; TI realiza integrações no espaço de rede e publica melhorias da loja online. A formação inclui aula, prática e avaliação. Corte, têmpera e inspeção possuem animações próprias na fábrica; a produção alimenta o estoque coletado pelo CL. Coletores adicionais alternam recebimento, conferência de endereços e inspeção dos terminais WMS.
O estacionamento usa vagas proporcionais aos donos de veículos e fica ao lado da loja nas primeiras expansões e no pátio central a partir do nível 7. Acesso de caminhões, estacionamento de expedição, passeios, bairro dos funcionários e ruas usam as mesmas coordenadas da simulação. Construções, vegetação e postes respeitam faixas livres das vias. Veículos estacionados continuam como obstáculos físicos.
Atualizações visuais das equipes e dos veículos são limitadas a 15 Hz; desenho usa instâncias e estruturas estáticas agrupadas. Navegação de obstáculos é atualizada a cada 0,2 s, com atualização imediata em mudanças de layout. Colisões rejeitam objetos distantes antes das verificações detalhadas e notificações da economia são agrupadas por quadro. Qualidade automática continua ajustando sombras, resolução e efeitos; telefones mantêm gestos sem botões de zoom.