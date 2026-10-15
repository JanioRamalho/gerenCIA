# Aprenda a converter valores de faturas no gerenCIA

Este guia ensina você a construir a primeira função de tratamento de valores do backend. Você escreverá o código, entenderá cada decisão e verificará o comportamento com testes. Ao terminar, textos como `"R$ 1.234,56"` poderão virar `Decimal("1234.56")`, sem precisar de fatura real, API em execução ou banco de dados.

Os arquivos de Python apresentados abaixo são arquivos que **você criará**. O guia divide a implementação em partes para que você consiga observar o efeito de cada mudança.

## 1 Entenda o resultado que vamos construir

A função terá o nome `converter_valor` e fará uma tarefa: transformar um texto monetário brasileiro em um número decimal.

```text
Texto recebido → validação do formato → normalização → Decimal
```

Exemplo de uma chamada futura:

```python
converter_valor("R$ 1.234,56")
```

Resultado esperado:

```python
Decimal("1234.56")
```

O exemplo não ficará fixado dentro da função. O parâmetro `valor` receberá um texto diferente em cada chamada. Depois, o leitor de CSV poderá passar o conteúdo da coluna de valor de cada linha para essa mesma função.

No dashboard, o número continuará sendo apresentado como `R$ 1.234,56`. Converter para calcular e formatar para mostrar são tarefas distintas.

**Por que começar por aqui:** você consegue praticar funções, strings, validação, exceções e testes com uma tarefa pequena que será usada no processamento das faturas. A arquitetura do projeto já reserva `backend/app/pipeline/` para esse tratamento, separadamente de `backend/app/db/`.

## 2 Defina quais entradas serão aceitas

Uma função confiável precisa de regras explícitas. Para esta primeira versão didática, adotaremos estas decisões:

- A entrada precisa ser uma string, isto é, um texto Python.
- `R$` é opcional e só pode aparecer no início, depois dos espaços externos.
- Espaços nas extremidades e entre `R$` e o número serão aceitos. Espaços dentro do número serão rejeitados.
- O sinal negativo é opcional e fica imediatamente antes dos dígitos. Com moeda, escreveremos `R$ -25,00`.
- A vírgula é o separador decimal. Se houver centavos, exigiremos exatamente dois dígitos.
- O ponto só separa milhares, em grupos de três dígitos. O primeiro grupo terá de um a três dígitos e não começará com zero.
- Valores inteiros sem centavos também serão aceitos.
- Texto vazio, formato inválido ou um tipo de entrada diferente deve produzir um erro, nunca ser convertido automaticamente em zero.

| Entrada | Resultado esperado | Motivo |
|---|---|---|
| `"R$ 1.234,56"` | `Decimal("1234.56")` | Moeda e formato brasileiro |
| `"89,90"` | `Decimal("89.90")` | Moeda opcional |
| `"-25,00"` | `Decimal("-25.00")` | Preserva o sinal recebido |
| `"R$ -25,00"` | `Decimal("-25.00")` | Moeda antes do sinal |
| `"0,00"` | `Decimal("0.00")` | Zero é um valor válido |
| `"1234"` | `Decimal("1234")` | Inteiro sem agrupamento |
| `"1.234"` | `Decimal("1234")` | Neste contrato brasileiro, o ponto indica milhar |
| `"  R$ 89,90  "` | `Decimal("89.90")` | Espaços nas posições permitidas |
| `"1234.56"` | `ValueError` | Ponto decimal não faz parte deste contrato |
| `"12.34,56"` | `ValueError` | Agrupamento de milhares incorreto |
| `"89,9"` | `ValueError` | Esta versão exige dois centavos |
| `""` | `ValueError` | Falta um valor |
| `None` | `TypeError` | A entrada não é texto |

Essas são decisões desta aula, não uma afirmação sobre todos os bancos. `"1.234"` significará 1234 porque escolhemos interpretar formato brasileiro. Se uma origem usar ponto decimal, ela precisará de uma regra própria; não tentaremos adivinhar.

**Pergunta para você:** por que transformar uma célula vazia em zero poderia esconder um problema na fatura?

## 3 Prepare os arquivos e o terminal

Abra o projeto no seu editor. Crie manualmente as pastas e os arquivos abaixo. Se algum arquivo já existir, confira o conteúdo antes de editar.

```text
backend/
  app/
    __init__.py
    pipeline/
      __init__.py
      money.py
  tests/
    test_money.py
```

Deixe os dois arquivos `__init__.py` vazios. Eles identificam os diretórios como pacotes Python. `money.py` guardará a função e `test_money.py` guardará os testes. O arquivo existente `backend/app/api/main.py` não precisa ser editado nesta aula.

No PowerShell, use a pasta principal do projeto:

```powershell
Set-Location -LiteralPath 'C:\Users\Janio\gerenCIA\gerenCIA'
.\.venv\Scripts\python.exe --version
.\.venv\Scripts\python.exe -m pytest --version
```

Na preparação deste guia, o ambiente do projeto tinha Python 3.14.7 e Pytest 9.1.1. Os comandos usam o ambiente virtual existente; não é necessário ativá-lo ou instalar bibliotecas para esta aula. `decimal` e `re` fazem parte do Python.

**Por que essa organização:** o tratamento não ficará dentro de uma rota HTTP nem terá dependência de uma sessão SQLAlchemy. Mais tarde, o serviço responsável pela importação poderá chamar a função e encaminhar o resultado para persistência.

## 4 Experimente o Decimal antes da função

Abra o modo interativo do Python:

```powershell
.\.venv\Scripts\python.exe
```

Quando aparecer `>>>`, digite as linhas abaixo, sem copiar esse marcador:

```python
from decimal import Decimal
valor = Decimal("1234.56")
print(valor)
print(type(valor))
print(Decimal("0.10") + Decimal("0.20"))
```

Você deve ver, respectivamente, `1234.56`, `<class 'decimal.Decimal'>` e `0.30` nos três comandos `print`.

O texto passado ao construtor usa ponto decimal. `Decimal("1234.56")` constrói um objeto numérico; as aspas descrevem a entrada do construtor, não tornam o resultado uma string. Evitaremos converter por `float`, pois isso pode introduzir aproximações binárias antes de chegar ao `Decimal`. Operações futuras com decimais também precisarão de regras de precisão e arredondamento. [Referência oficial do Decimal](https://docs.python.org/pt-br/3/library/decimal.html).

Digite `exit()` para voltar ao PowerShell.

**Confira seu entendimento:** qual é a diferença entre `"1234.56"` e `Decimal("1234.56")`?

## 5 Escreva o esqueleto da função

No arquivo `backend/app/pipeline/money.py`, digite:

```python
from decimal import Decimal


def converter_valor(valor: str) -> Decimal:
    raise NotImplementedError("Vamos implementar a conversão por etapas")
```

Entenda o que você escreveu:

- `from decimal import Decimal` disponibiliza o tipo que usaremos como resultado.
- `def` inicia uma função. O nome `converter_valor` descreve a tarefa.
- `valor` é o parâmetro que receberá o texto de cada chamada.
- `: str` documenta o tipo de entrada esperado e `-> Decimal` documenta o retorno.
- As anotações de tipo não fazem a validação em tempo de execução por você.
- `raise NotImplementedError(...)` marca o corpo que ainda falta construir.

As linhas do corpo da função devem ter quatro espaços de indentação. Salve o arquivo.

## 6 Escreva um teste que descreva o objetivo

No arquivo `backend/tests/test_money.py`, digite:

```python
from decimal import Decimal

from app.pipeline.money import converter_valor


def test_converte_valor_com_moeda_e_milhar():
    resultado = converter_valor("R$ 1.234,56")

    assert resultado == Decimal("1234.56")
    assert isinstance(resultado, Decimal)
```

A primeira verificação confere o valor e a segunda confere o tipo devolvido. O Pytest usa `assert` para verificar uma condição e informar quando ela falha. [Referência oficial sobre assert no Pytest](https://docs.pytest.org/en/stable/how-to/assert.html).

Rode o teste na pasta principal:

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend backend/tests/test_money.py -q
```

`-m pytest` executa o Pytest com o Python escolhido. `-o pythonpath=backend` permite encontrar o pacote `app` dentro de `backend`. O caminho seguinte escolhe o arquivo de testes, e `-q` reduz a quantidade de mensagens.

**Resultado esperado agora:** o teste falha com `NotImplementedError`. Isso confirma que conseguiu importar e chamar sua função, mas ela ainda não implementa a conversão. Um erro de importação é outro problema; consulte a seção de diagnóstico antes de continuar.

## 7 Valide o tipo e prepare o texto

Volte ao arquivo `money.py`. Remova a linha com `raise NotImplementedError(...)`. No corpo da função, digite estas linhas:

```python
    if not isinstance(valor, str):
        raise TypeError("O valor deve ser informado como texto")

    texto = valor.strip()
    texto = texto.removeprefix("R$").strip()
```

`isinstance` verifica o tipo. `TypeError` sinaliza que a função recebeu algo fora do tipo combinado. `strip()` retira espaços nas extremidades. `removeprefix("R$")` retira a moeda apenas se estiver no início; o segundo `strip()` retira o espaço que poderia ter ficado após a moeda.

Por exemplo, `"  R$ 1.234,56  "` se torna `"1.234,56"`. O texto original permanece no parâmetro `valor`; estamos preparando outra variável. Não use uma remoção indiscriminada de todos os espaços, porque ela faria `"1 234,56"` parecer uma entrada válida.

**Resultado esperado nesta etapa:** o teste ainda falha, agora porque a função termina sem devolver um resultado. Vamos completar a validação e o retorno a seguir.

## 8 Valide o formato antes de remover separadores

Acrescente `import re` ao início de `money.py`, junto do import de `Decimal`. Antes da definição da função, acrescente esta constante:

```python
PADRAO_BRL = re.compile(
    r"-?(?:[0-9]+|[1-9][0-9]{0,2}(?:\.[0-9]{3})+)(?:,[0-9]{2})?"
)
```

Essa expressão descreve as regras que escolhemos. Leia por partes:

| Parte | Significado na nossa regra |
|---|---|
| `-?` | Sinal negativo opcional |
| `[0-9]+` | Um ou mais dígitos sem separador de milhares |
| `\|` | Na expressão, a barra vertical separa alternativas |
| `[1-9][0-9]{0,2}` | Primeiro grupo de um a três dígitos, sem zero inicial |
| `(?:\.[0-9]{3})+` | Um ou mais grupos com ponto e três dígitos |
| `(?:,[0-9]{2})?` | Centavos opcionais, com vírgula e dois dígitos |

O prefixo `r` preserva a barra invertida do padrão. Os grupos `(?:...)` organizam as alternativas sem capturar valores. A barra antes do ponto faz com que ele signifique um ponto literal.

No corpo da função, depois das duas linhas que preparam `texto`, acrescente:

```python
    if PADRAO_BRL.fullmatch(texto) is None:
        raise ValueError("Valor inválido para o formato brasileiro")
```

`fullmatch` exige que todo o texto corresponda ao padrão. [Referência oficial do re.fullmatch](https://docs.python.org/pt-br/3/library/re.html#re.fullmatch).

**Por que validar antes de substituir:** se você remover todos os pontos primeiro, `"12.34,56"` vira `"1234,56"` e o erro da origem desaparece. Validando antes, você preserva a diferença entre uma entrada correta e uma malformada.

`ValueError` indica que o tipo era adequado, mas o conteúdo não atende ao contrato. Não devolva zero quando esse erro acontecer.

## 9 Normalize e devolva o Decimal

Depois da validação, ainda dentro da função, acrescente:

```python
    normalizado = texto.replace(".", "").replace(",", ".")
    return Decimal(normalizado)
```

O primeiro `replace` remove os separadores de milhares que já foram validados. O segundo troca a vírgula decimal por ponto. `return` entrega o objeto numérico ao código que chamou a função.

Para a entrada `"R$ 1.234,56"`, confira esta sequência:

```text
valor        = "R$ 1.234,56"
texto        = "1.234,56"
normalizado  = "1234.56"
retorno      = Decimal("1234.56")
```

Nesta aula não vamos arredondar valores recebidos com centavos extras: vamos rejeitá-los. Também não precisamos acrescentar `.00` aos inteiros para que sejam números válidos. A exibição com duas casas será uma decisão de apresentação.

Salve o arquivo e execute novamente o comando do passo 6. **Agora o primeiro teste deve passar.** Se falhar, compare a ordem das etapas e a indentação antes de mudar as regras.

## 10 Amplie os testes para os outros comportamentos

No arquivo `test_money.py`, adicione `import pytest` junto dos imports. Mantenha o primeiro teste e acrescente os testes abaixo. Os dados de teste são exemplos de entrada, não faturas predefinidas para a aplicação.

```python
@pytest.mark.parametrize(
    "entrada, esperado",
    [
        ("R$ 1.234,56", "1234.56"),
        ("89,90", "89.90"),
        ("-25,00", "-25.00"),
        ("0,00", "0.00"),
        ("1234", "1234"),
        ("1.234", "1234"),
        ("1.234.567,89", "1234567.89"),
        ("  R$ 89,90  ", "89.90"),
        ("R$ -25,00", "-25.00"),
    ],
)
def test_converte_formatos_aceitos(entrada, esperado):
    resultado = converter_valor(entrada)

    assert resultado == Decimal(esperado)
    assert isinstance(resultado, Decimal)


@pytest.mark.parametrize(
    "entrada",
    [
        "", " ", "R$", "abc", "12.34,56", "1,234.56",
        "1234.56", "89,9", "1,234", "1 234,56",
        "NaN", "Infinity", "1e3", "-R$ 25,00",
        "R$ R$ 10,00", "0.123,45", "+25,00",
    ],
)
def test_rejeita_textos_invalidos(entrada):
    with pytest.raises(ValueError):
        converter_valor(entrada)


@pytest.mark.parametrize("entrada", [None, 10, 10.5, True])
def test_rejeita_entradas_que_nao_sao_texto(entrada):
    with pytest.raises(TypeError):
        converter_valor(entrada)
```

`parametrize` repete o teste com cada caso da lista. Nos testes de erro, `pytest.raises` exige a exceção indicada; se a função aceitar o valor indevidamente, o teste falha.

Execute o mesmo comando. Com o primeiro teste e esses três grupos, o resultado esperado é **31 testes aprovados**. O tempo mostrado pelo Pytest pode variar.

**Exercício:** antes de rodar, preveja o resultado de `"10,00 reais"`. Depois inclua esse caso entre os textos inválidos e confira sua previsão. Ao acrescentar um caso, a contagem de testes também aumenta.

## 11 Confira os problemas mais comuns

| Mensagem ou comportamento | O que conferir |
|---|---|
| `No module named app` | Execute na raiz e mantenha `-o pythonpath=backend` |
| `No module named pytest` | Confira se usou o Python de `.venv`, como no comando do guia |
| `IndentationError` | Use quatro espaços por nível e evite misturar tabs e espaços |
| `NotImplementedError` | Remova o marcador inicial quando começar o passo 7 |
| A função devolve `None` | Confira se escreveu `return` dentro da função, depois da validação |
| `decimal.InvalidOperation` | Confira a validação e a troca da vírgula antes do construtor |
| `"12.34,56"` foi aceito | Confira se o padrão é verificado antes de remover pontos |
| O sinal negativo desapareceu | Confira se você está removendo apenas os separadores |

Uma falha no teste informa uma diferença entre o comportamento esperado e o observado. Leia o caso que falhou e a linha indicada. Mude uma coisa por vez e execute novamente.

## 12 Entenda como isso será conectado depois

O futuro leitor de CSV extrairá um texto de cada linha. O pipeline chamará `converter_valor`, e a etapa de persistência receberá o resultado validado. Quando uma linha tiver valor inválido, o processamento deverá registrar o erro e a linha de origem, conforme o planejamento do projeto.

```text
CSV → texto da coluna de valor → converter_valor → Decimal
                                                   ↓
                                   persistência em coluna numérica
```

A conexão com PostgreSQL será implementada em outra parte. Não coloque SQL, sessão do banco, chamadas HTTP ou leitura de arquivos dentro desta função. Ela deve continuar recebendo um valor e devolvendo um resultado ou erro.

Há tarefas futuras que esta aula não resolve:

- Células numéricas de XLSX podem chegar como números, e precisarão de uma regra de leitura e precisão própria. Não passe esses números para esta função sem adaptar o contrato.
- Interpretar compra, estorno e pagamento da fatura depende das informações da transação e das convenções da origem. Esta função só preserva o sinal do texto recebido.
- A coluna monetária no banco precisará de precisão e escala definidas.
- O contrato JSON da API e a formatação em reais no frontend serão definidos durante a integração. Os cálculos financeiros continuarão no backend.

Essas separações permitem reutilizar a conversão quando as outras partes forem construídas. Compatibilidade depende de manter explícitas as regras de entrada, retorno e erro.

## 13 Termine a aula explicando o que você fez

Antes de considerar concluído, confira:

- [ ] Você criou os arquivos e escreveu a função por etapas.
- [ ] Os casos aceitos devolvem um `Decimal` com o valor correto.
- [ ] Entradas inválidas produzem o erro esperado.
- [ ] Os testes passam sem banco e sem iniciar a API.
- [ ] Você consegue explicar por que valida antes de remover pontos.
- [ ] Você consegue explicar por que usa `Decimal` a partir de texto.
- [ ] Você entende que `"1.234"` é milhar apenas dentro do contrato escolhido.
- [ ] Você sabe distinguir conversão para cálculo de formatação para a tela.

Sugestão de estudo: faça os passos 1 a 6 primeiro; depois implemente os passos 7 a 9; por último, acrescente os testes do passo 10. Ao terminar cada bloco, escreva duas frases com o que entendeu e o que ainda precisa esclarecer.

Quando quiser minha ajuda, envie o trecho que escreveu, o comando executado e a mensagem de erro, ou explique qual decisão ficou confusa. Posso revisar e dar pistas sem assumir a implementação.

## Referências para continuar estudando

- [Decimal na documentação do Python](https://docs.python.org/pt-br/3/library/decimal.html): construção de valores decimais e cuidados com precisão.
- [Expressões regulares na documentação do Python](https://docs.python.org/pt-br/3/library/re.html): padrões e validação de texto inteiro.
- [Assert e exceções na documentação do Pytest](https://docs.pytest.org/en/stable/how-to/assert.html): verificações de resultados e erros.
- [Arquitetura do backend](../backend/README.md): separação entre pipeline, serviços e banco.
- [Planejamento do gerenCIA](planejamento-gerencia.txt): valores monetários com Decimal, qualidade e testes previstos.
