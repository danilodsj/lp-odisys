# LP Odisys — guia do projeto e dos ambientes

Leia este arquivo antes de aplicar qualquer modificação. Ele descreve a diferença entre
**produção** e **staging** e as regras que evitam que uma mudança de staging vaze para produção
(ou o contrário).

## O projeto

Landing page **estática de página única**. Sem framework, sem build, sem dependências —
o que está no repositório é exatamente o que vai para o ar.

```
index.html          a LP inteira (head com SEO/GTM + todo o conteúdo)
css/styles.css      estilos
js/main.js          interações
assets/             logo, OG images, favicons
robots.txt          robots de PRODUÇÃO
robots.staging.txt  robots de STAGING (servido via rewrite por host)
sitemap.xml         sitemap de produção
vercel.json         config de deploy (idêntico em todas as branches)
tools/              scripts auxiliares de geração de assets (não vão para o ar)
```

Deploy pela **Vercel**, projeto `lp-odisys`, team `danilodsjs-projects`, plano **Hobby**.

## Ambientes

| Branch    | Ambiente Vercel | Domínio                              | Indexável | `environment` no dataLayer |
|-----------|-----------------|--------------------------------------|-----------|----------------------------|
| `main`    | Production      | `odisys.com.br`, `www.odisys.com.br` | **Sim**   | `production`               |
| `staging` | Preview         | `lpstaging.odisys.com.br`            | Não       | `staging`                  |
| outras    | Preview         | `*-danilodsjs-projects.vercel.app`   | Não       | `staging`                  |

`lpstaging.odisys.com.br` é um **preview deployment** com domínio customizado atribuído à branch
`staging` (Vercel → Settings → Domains → Git Branch). Ele fica atrás da **Vercel Authentication**:
só quem está logado na conta Vercel acessa. Para mostrar a terceiros, use o link compartilhável
da página do deployment.

## Fluxo de trabalho

```
feature branch  →  PR para `staging`  →  validar em lpstaging.odisys.com.br  →  PR para `main`
```

Nunca commite direto em `main`. Nada vai para produção sem ter passado pelo staging.

## Regras ao editar

1. **URLs absolutas sempre apontam para produção.** Canonical, `og:url`, `og:image`,
   `twitter:image` e o JSON-LD no `index.html`, mais o `sitemap.xml`, usam
   `https://odisys.com.br` — **inclusive na branch `staging`**. Não troque por URL de staging:
   quem impede a indexação do staging é o header `X-Robots-Tag` do `vercel.json`, não a canonical.

2. **Dois arquivos de robots, propósitos diferentes.** `robots.txt` é o de produção (`Allow: /`);
   `robots.staging.txt` é o de staging (`Disallow: /`). Editar um não implica editar o outro.

3. **`vercel.json` é idêntico em todas as branches.** As regras específicas de staging são
   condicionadas por host:

   ```json
   "has": [{ "type": "host", "value": "lpstaging.odisys.com.br" }]
   ```

   Isso mantém o arquivo igual em `main` e `staging`, então merges entre elas nunca conflitam nem
   vazam regra de um ambiente para o outro. Ao adicionar uma regra nova, decida explicitamente se
   ela vale para os dois ambientes (sem `has`) ou só para o staging (com `has`).

4. **GTM: um container só, separado pelo dataLayer.** O container `GTM-TQBQ5R4G` carrega nos dois
   ambientes. O bloco no topo do `<head>` do `index.html` empurra `environment` para o dataLayer
   (`production` só em `odisys.com.br`/`www.odisys.com.br`, `staging` em qualquer outro host) e
   **precisa vir antes do snippet do GTM**. No GTM isso é lido pela Data Layer Variable
   `environment`, usada para filtrar staging no GA4. Não mexa nesse bloco nem no snippet sem
   entender o efeito nos relatórios.

5. **Não crie Custom Environments.** `vercel deploy --target=staging` e os Custom Environments da
   Vercel são recursos Pro+; a conta é Hobby. O staging é branch + domínio, como descrito acima.

## Como verificar uma mudança

```bash
# staging protegido (deslogado) → 401 da Vercel Authentication
curl -sI https://lpstaging.odisys.com.br | head -1

# produção NÃO pode ter noindex nem o robots de staging
curl -sI https://odisys.com.br | grep -i x-robots-tag   # não deve retornar nada
curl -s  https://odisys.com.br/robots.txt | head -5     # deve continuar com "Allow: /"
```

No navegador, logado em `https://lpstaging.odisys.com.br`:

- DevTools → Network → documento: header `x-robots-tag: noindex, nofollow`
- `https://lpstaging.odisys.com.br/robots.txt` mostra `Disallow: /`
- Console: `dataLayer[0].environment` === `'staging'` (e `'production'` em `odisys.com.br`)

## Fora do repositório

Domínio, DNS, Vercel Authentication e a configuração do container GTM são feitos nos painéis da
Vercel e do Google Tag Manager. Nenhum commit altera essas configurações — se algo ali precisa
mudar, avise em vez de tentar resolver no código.
