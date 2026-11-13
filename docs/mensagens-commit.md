# Mensagens de commit desta entrega

Branch: `feat/alembic-upload-historico`. Destino da revisão: `main` por pull
request, com merge manual pelo usuário.

Os commits agrupam alterações relacionadas; cada arquivo pequeno não precisa
de um commit separado. Para consultar os identificadores finais:

```powershell
git log --oneline origin/main..feat/alembic-upload-historico
```

## Integração e alterações revisadas

### 1. Compatibilidade com a main

```text
merge: integra main preservando upload e painel da segunda versao
```

Integra a main em `d741130` somente à branch de trabalho. Preserva a segunda
versão de upload, análise e dashboard, resolvendo os conflitos de navegação.

### 2. Banco e configuração

```text
feat(db): versiona esquema com Alembic e preserva bancos existentes
```

Configuração, revisões, snapshot histórico, adoção sem recriar tabelas,
modelos alinhados e conexão de migração. O instalador antigo passa a delegar
ao Alembic. Atualiza o guia do banco e preserva os testes de migração que já
estavam na árvore de trabalho, sem executá-los nesta revisão. O arquivo de
exemplo contém somente valores fictícios.

### 3. Compatibilidade do histórico

```text
fix(uploads): preserva leitura do historico apos integrar a main
```

Lê metadados e totais disponíveis nos dois formatos de registros e usa
caminho nulo para o original descartado, conforme o esquema migrado.

### 4. Interface e cliente da API

```text
refactor(frontend): compatibiliza painel vazio e unifica acesso a API
```

Mantém o dashboard com dados da main e adapta a preparação da tela vazia.
Reutiliza o cliente HTTP, cancela consultas, mantém o alias `/app/uploads`,
carrega telas com gráficos sob demanda e corrige a rolagem das tabelas no
celular. Não aplica o protótipo de janela de envio ao produto.

### 5. Limpeza e documentação

```text
chore: remove lock vazio e documenta revisao das alteracoes
```

Remove o lockfile sem projeto na raiz, corrige a documentação de estado e
registra achados, validações, limitações e estas mensagens. A implementação
alternativa de upload e seus artefatos obsoletos foram retirados antes dos
commits; por isso não aparecem como exclusões de arquivos que nunca foram
versionados.

## Commits anteriores que já pertenciam a esta branch

Eles foram preservados, sem reescrever o histórico:

| Commit | Mensagem existente |
|---|---|
| `7997fa8` | postgres para instalar no Neon |
| `a41eebb` | Correção de bugs |
| `637d4df` | Novas seções |
| `867acc2` | refactor(scripts): verificações do front com funções compartilhadas em helpers.py |
| `dd2d6fe` | atualização do README e arquitetura |

Como essas mensagens antigas são genéricas, use a divisão acima como
referência para as próximas alterações: assunto, ação e resultado concreto.
