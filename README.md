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

## Empresa em 15 etapas

| Nível | Empresa | Nova operação |
| --- | --- | --- |
| 1 | Garagem de bairro | 1 técnico, 1 caixa e 1 box; trocas de vidro automáticas |
| 2 | Loja e recebimento | 4 boxes, produtos para carros e motos, coletores no CL e retiradas |
| 3 | Centro logístico | Mais boxes e técnicos, ampliação da oficina e do estoque endereçado; outdoor Autoglass |
| 4 | Sede comercial | Vendedores, reuniões, encomendas e expedição |
| 5 | Hub de expedição | Duas docas para caminhões e escritório maior |
| 6 | Comércio digital | TI, desenvolvedores, servidores e loja online |
| 7 | Rede de filiais | Vendas para a rede de lojas |
| 8 | Frotas corporativas | Contratos de fornecimento para frotas e centro de educação |
| 9 | Distribuição regional | Três docas e distribuição de lotes |
| 10 | Central de seguros | Parcerias com seguradoras |
| 11 | Marketplace nacional | Outro canal de vendas digitais |
| 12 | Operação automatizada | Automação e produtividade de logística |
| 13 | Expansão internacional | Quatro docas e exportação |
| 14 | Polo industrial | Fabricação de vidros, controle de qualidade e coleta pelo CL |
| 15 | Grupo Autoglass | Grandes contratos e integração do grupo |

A loja chega a 12 boxes, 12 técnicos, 3 caixas, 8 coletores, 8 vendedores e 6 desenvolvedores. O CL possui até 36 endereços e 432 itens. A área da empresa e a cidade crescem junto com as ampliações. Os limites de melhorias mudam em cada etapa. **Requisitos** apresenta todas as compras e metas da próxima ampliação; listas compridas têm páginas, sem rolagem.

Os contratos corporativos crescem em lotes. A operação visível separa volumes representativos, enquanto o pedido informa sua quantidade comercial e o valor total. Isso permite faturamento bilionário nos níveis finais com uma quantidade limitada de personagens na tela. A receita de um contrato entra quando a encomenda é carregada e expedida; a tela **Operação → Empresa** separa o faturamento por canal.

### Atendimento, CL e encomendas

Clientes chegam de carro ou moto, saem sem carregar produtos, entram na sala de espera e sentam. O técnico se levanta do banco ao lado das gavetas azuis, busca o produto e faz a instalação. O cliente paga no caixa depois do serviço, com um efeito de confirmação do pagamento. Demora pode gerar reclamações. Vidros, retrovisores de carros, retrovisores de motos e peças têm preços, duração, produtos e animações próprios.

O CL começa no nível 2. Caminhões levam pacotes de quatro itens para docas reservadas. Coletores retiram as caixas, leem o código e armazenam em endereços disponíveis. O manifesto prioriza produtos com menos estoque. Cada coletor tem uma estação e os endereços não são compartilhados durante uma tarefa. Técnicos repõem a área de venda quando o estoque fica baixo. No primeiro nível, a reposição é local e automática.

Ligações e reuniões do escritório geram encomendas. Desde o nível 6, os desenvolvedores programam, publicam melhorias no site e geram pedidos online. Técnicos separam os produtos, embalam e entregam para veículos de expedição. Os entregadores só são chamados quando a embalagem está pronta. Computadores, cadeiras, treinamento, embalagem, servidores e marketing têm efeitos na operação. Os canais empresariais dos níveis 7–15 entram nas ligações de venda e nos lotes de encomendas.

### Navegação

A movimentação usa um grafo de salas, A* com índice espacial, colisões circulares, reservas de estações, filas nas portas, áreas de espera fora da passagem e desvio quando um personagem para de avançar. As rotas interiores ficam dentro das salas. Carros, motos e caminhões usam caixas orientadas, aceleração, desaceleração e curvas suaves. Manobras têm prioridade local; docas utilizam uma faixa de acesso separada dos caminhões estacionados. Ampliações de área aguardam veículos em manobra. Quando a próxima etapa está pronta para compra, há pequenas janelas de expedição para permitir a construção.

## Controles

- Computador: arraste o cenário com o mouse; roda ou botões para zoom.
- Smartphone e tablet: arraste com um dedo; pinça com dois dedos para zoom. Nenhum joystick aparece na tela.
- Centralizar enquadra o terreno atual; os botões de câmera permitem explorar detalhes.
- Melhorias têm abas Loja, CL, Escritório, TI e Rede. Painéis recolhíveis e páginas evitam rolagem.
- Escape pausa ou fecha o painel aberto. A interface acompanha a orientação e as áreas seguras.

A logo PNG fornecida está no menu, na fachada, nos caminhões e no outdoor a partir do nível 3. Os ícones da interface são SVGs. O cenário e os personagens são modelos low-poly procedurais.

## Tutorial, áudio e clima

O tutorial da primeira partida apresenta seis passos e pausa a simulação. Pode ser pulado ou reaberto em **Configuração → Jogo → Como jogar**. Saves anteriores continuam com seu progresso.

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

Em **Operação → Evolução**, acompanhe as 15 etapas, as operações liberadas e as mudanças na cidade. Casas dão lugar a comércio, prédios e um distrito empresarial, com mais pedestres e veículos. Os nomes de setores foram removidos do cenário; marcas, móveis, pisos e equipamentos identificam as áreas.

- **Nível 8:** centro de educação com professor, aulas, estação de prática e certificação. Formações e currículo aumentam o ritmo de técnicos, CL, vendedores e TI, até 50%.
- **Nível 14:** linhas de corte, têmpera e qualidade produzem vidros. Coletores retiram a produção, conferem, endereçam e abastecem a loja pelo fluxo existente. O buffer cheio pausa a produção até a próxima coleta.
- **Nível 15:** grupo empresarial com campus, fábrica, sede, comércio digital, quatro docas e contratos de grande volume. Continue investindo nas equipes e operações.

O painel **WMS** mostra ocupação dos endereços e as últimas 40 movimentações: recebimento, conferência, endereçamento, reposição, separação, embalagem, produção e expedição. Coletores fazem inventários físicos quando disponíveis. Os grandes contratos representam a rede por lotes; as caixas na cena representam os volumes locais de cada pedido.

Em **Operação → Empresa**, os botões de educação e fábrica aproximam a câmera dessas áreas. Mouse, toque e pinça continuam funcionando sem controle virtual visível.

## Compilação local

`npm run build` gera a versão para GitHub Pages.

## Prévias locais

Em desenvolvimento, `/?preview=1` até `/?preview=15` abre cada etapa com uma economia isolada, sem ler ou alterar o save real. `/?preview=1&tutorial=1` apresenta o tutorial. Acrescente `&weather=rain` ou `&weather=storm` para apresentar o clima. Esses atalhos não estão ativos no build de produção.
