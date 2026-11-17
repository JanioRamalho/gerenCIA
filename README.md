# gerenCIA

Projeto acadêmico de análise financeira a partir de extratos e faturas CSV/XLSX.
React, TypeScript e Recharts apresentam os dados; FastAPI, pandas e PostgreSQL
concentram o processamento e as regras financeiras.

A área interna tem cinco abas:

- **Painel:** categorias com cores e ícones, comparação entre dois meses escolhidos,
  evolução, estatística descritiva, serviços recorrentes e cinco lançamentos recentes.
- **Arquivos:** envio, exemplos CSV/XLSX, histórico, qualidade, rejeições e exclusão.
- **Transações:** filtros, paginação, origem e correção de categoria, com regra pessoal opcional.
- **Limites:** valores mensais por categoria e avisos no mês corrente.
- **Conta:** dados da sessão e exclusão dos próprios dados com confirmação.

O site público mantém sua demonstração fictícia. As análises internas usam os
arquivos da pessoa autenticada. IA, treinamento e predição estão fora desta etapa
por decisão do usuário em 17/11/2026.

## Executar localmente

Prepare o ambiente Python com as dependências de `requirements.txt` e copie
`.env.example` para `.env`, configurando seu PostgreSQL. Não publique credenciais.
Para banco novo, instale o esquema explicitamente:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Em banco existente, siga antes o [guia do banco](docs/database-setup.md), com
cópia de segurança e conferência da revisão. A aplicação não migra o banco no startup.

Em um terminal:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.api.main:app --app-dir backend --reload
```

Em outro:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

O Vite encaminha `/api` para `http://127.0.0.1:8000`. Para outra API local, defina
`GERENCIA_API_URL` antes de iniciar o Vite. Consulte `/api/health`,
`/api/health/database` e `/docs` na API.

## Importação e exemplos

CSV e XLSX têm limite de **4 MB**. São reconhecidos extrato/fatura Nubank e
planilha-modelo; nesta última, escolha extrato ou fatura ao enviar.
Os exemplos estão disponíveis em Arquivos e em `frontend/public/exemplos/`.
Envie a versão CSV **ou** XLSX de cada exemplo. Identificadores bancários permitem
reconhecer cópias; operações apenas parecidas continuam contadas e são sinalizadas.

O arquivo original não é armazenado. Permanecem transações, origem, rejeições e
relatório de qualidade. Receitas e pagamentos de fatura ficam separados do gasto;
estornos reduzem as saídas. As análises são recalculadas a partir dos dados persistidos.

## Verificar

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend backend/tests -q
npm --prefix frontend run build
```

Os testes de banco criam um PostgreSQL temporário e não usam o banco do `.env`.
No Windows, o PostgreSQL precisa estar instalado e acessível aos testes.
Os [scripts Playwright](scripts/frontend/README.md) cobrem interface e acessibilidade;
os roteiros que criam contas ou alteram dados exigem API e banco descartáveis.

## Documentação e entrega

- [Arquitetura](docs/arquitetura.md), [análise de dados](docs/analise-de-dados.md) e [API](backend/README.md).
- [Plano aprovado](docs/superpowers/plans/2026-11-16-renovacao-interna-v1.md) e [escopo atualizado sem IA](docs/superpowers/specs/2026-11-17-escopo-sem-ia.md).
- [Publicação na Vercel](docs/vercel.md): mesma origem para frontend/API e PostgreSQL externo.
- [Validação local](docs/validacao-renovacao-v1.md) e [roteiro de demonstração](docs/roteiro-banca-v1.md).

O prazo informado é **27/11/2026**. Esta refatoração acontece na branch `Janio`,
preservando a `main`. Commits permitem recuperar o código; restauração de banco
depende de backup e das restrições de cada migração.
