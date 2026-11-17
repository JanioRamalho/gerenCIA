# Atualização de escopo — interface e análises sem IA

Data: 17 de novembro de 2026. Branch: `Janio`.

O usuário determinou durante a execução que **a IA não entra nesta etapa**. Esta instrução prevalece sobre as partes de diagnóstico, Groq e treinamento descritas nos documentos anteriores. Não é necessário escolher agora alvo de predição, algoritmo, provedor ou dados de treino.

## Entrega atual

- Renovar Painel, Arquivos, Transações, Limites e Conta na direção Categorias em destaque.
- Preservar as análises financeiras e estatísticas determinísticas, comparação entre meses, assinaturas/recorrências e qualidade dos dados.
- Concluir os fluxos pendentes dessas abas, simplificar código e retirar duplicação e estruturas substituídas.
- Manter o prazo de entrega de 27/11/2026 e os commits locais na `Janio`.
- Preparar a configuração existente para **Vercel**, destino informado pelo usuário. Publicação e validação na conta não são presumidas a partir de uma configuração local.

## Adiado

Diagnóstico textual, chamadas a provedores, treino e predição. Não manter endpoints, modelos de persistência ou mensagens de produto para uma integração de IA que não será entregue agora. As tabelas/revisões históricas já commitadas continuam imutáveis; o rascunho novo de diagnóstico foi retirado antes de qualquer aplicação no banco de uso.

P15/P16 e os aceites A12/A13 do plano anterior ficam fora da entrega atual. As demais verificações continuam válidas quando não dependerem desses recursos. A referência ao mês anterior do calendário permanece honesta nas análises que usam esse nome; a comparação livre permite os dois meses escolhidos.

## Compatibilidade com a hospedagem

Reutilizar a configuração de Services, o entrypoint `backend/main.py` e os encaminhamentos de mesma origem presentes no repositório. A configuração é compatível com o formato descrito no [guia atual de Vercel Services](https://vercel.com/kb/guide/vercel-services); a conta/projeto ainda precisa ser validada antes de declarar publicação concluída.

Como a Vercel limita corpos de requisições de Functions a 4,5 MB, padronizar os arquivos do aplicativo em **até 4 MB**, tanto na validação quanto nas mensagens. Essa adaptação evita oferecer upload de 5 MB que a hospedagem recusaria antes da API. Não adicionar armazenamento de arquivos originais ou outro serviço apenas para contornar esse limite. Fonte: [limites de Vercel Functions](https://vercel.com/docs/functions/limitations).

A definição de IA futura será um trabalho separado, com seus próprios requisitos e validação. Não bloquear a interface e as análises atuais por essa decisão adiada.
