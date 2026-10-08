# Autoglass Inc.

Jogo idle 3D com Three.js, Vite e MVVM. O progresso fica salvo no navegador.

## Executar

Na pasta `C:\projetos\webjogos\autoglass`:

```sh
npm install
npm run dev
```

`npm run build` gera os arquivos de produção em `dist`. `npm run preview` abre essa versão localmente.

## Progressão

| Etapa | Compra | Estrutura |
| --- | --- | --- |
| Garagem inicial | — | 1 box, 1 técnico, 1 caixa; sala de espera interna |
| Loja ampliada | R$ 450 | 4 boxes, 2 caixas, até 4 técnicos; terceiro caixa por R$ 380 |
| Loja com CL | R$ 1.600 | Terreno maior, doca, 6 endereços de estoque e 2 funcionários do CL; até 4 |

Os técnicos descansam sentados ao lado das gavetas azuis. Os clientes entram pela porta da sala de espera, sentam e só são chamados ao caixa depois da instalação. Demora pode causar reclamações. **Produtividade** acelera a caminhada e a troca de vidro; cada compra acrescenta 25% à produtividade inicial.

### Centro logístico

O CL começa a funcionar na terceira etapa. Um caminhão chega à doca com oito pacotes, cada um com quatro vidros. A equipe coleta os pacotes, lê o código com um coletor e guarda os produtos nos endereços **A-01 a A-06**. As prateleiras mostram a quantidade armazenada.

Quando os vidros de frente ficam baixos, um técnico busca até seis unidades em um endereço do CL e repõe a área de venda. Enquanto faltar vidro, novos serviços aguardam estoque. As entregas são automáticas e respeitam a capacidade disponível. Nas etapas menores, a reposição local é automática. Dinheiro, melhorias e estoque armazenado são persistidos; personagens e entregas em andamento são recriados ao reabrir o jogo.

## Controles e telas

- Computador: arrastar o cenário; roda do mouse ou botões para zoom.
- Tablet e smartphone: tocar e arrastar com o controle sob o dedo; dois dedos para zoom.
- Centralizar enquadra a loja da etapa atual. O teto pode ser ocultado.
- Melhorias têm abas **Loja** e **CL**, com painéis recolhíveis e sem rolagem.
- Escape pausa ou continua. A interface acompanha a orientação e a área segura da tela.

## GitHub Pages

1. Envie o conteúdo desta pasta para o repositório, incluindo `package-lock.json` e `.github/workflows/pages.yml`.
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
3. Faça um push na branch padrão ou execute **Publicar Autoglass no GitHub Pages** na aba Actions.

O workflow instala as dependências, compila e publica `dist`. O caminho do repositório é definido automaticamente com o `base_path` do Pages; localmente, os assets usam caminhos relativos. Também funciona para repositórios `usuario.github.io`.

Para compilar manualmente com um caminho específico no PowerShell:

```powershell
$env:VITE_BASE_PATH='/nome-do-repositorio/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

Referência: [publicação de projetos Vite no GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages).

## Organização

- `src/models`: economia, navegação, tráfego, atendimento e logística; `ShopLayout` mantém coordenadas comuns à física e à cena.
- `src/viewmodels`: ações do jogador e ciclo da aplicação.
- `src/views`: interface, cidade e modelos low-poly procedurais.
- `src/services`: câmera isométrica com mouse e touchscreen.

Os modelos 3D externos podem substituir as geometrias procedurais. A simulação continua independente da renderização.

## Prévias locais

Com `npm run dev`, abra `/?preview=1`, `/?preview=2` ou `/?preview=3` para visualizar as etapas sem alterar o progresso salvo. As prévias têm saldo para experimentar as melhorias; no nível 3, o estoque inicial baixo deixa o recebimento e a reposição visíveis. Esses atalhos são removidos da versão de produção.
