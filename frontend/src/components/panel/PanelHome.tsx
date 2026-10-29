import type { User } from "../../auth/api";
import BarsMark from "../BarsMark";
import { formatDate } from "./formatDate";

/** Uma etapa da lista "Próximos passos". */
type Step = {
  title: string;
  text: string;
};

// As etapas que vão preencher o painel, na ordem em que o projeto as constrói.
// A primeira é a próxima a ficar pronta.
const STEPS: Step[] = [
  {
    title: "Envie um extrato ou uma fatura",
    text: "Arquivos CSV ou XLSX do Nubank. De outros bancos, pela planilha-modelo do gerenCIA.",
  },
  {
    title: "Veja para onde foi o dinheiro",
    text: "Gastos por mês e por categoria, com a média, a mediana e as maiores despesas de cada período.",
  },
  {
    title: "Defina limites por categoria",
    text: "Um teto mensal opcional para cada categoria, com aviso no painel ao chegar a 80% e ao passar de 100%.",
  },
  {
    title: "Receba o diagnóstico do mês",
    text: "Um resumo em linguagem simples, gerado por IA a partir das suas análises, com sugestões de onde economizar.",
  },
];

type PanelHomeProps = {
  user: User;
};

/**
 * Início do painel enquanto a pessoa ainda não enviou nenhum arquivo: as boas-
 * vindas, as etapas que vão preencher o painel e um resumo da conta.
 */
export default function PanelHome({ user }: PanelHomeProps) {
  const firstName = user.name.split(" ")[0];

  // As boas-vindas ficam num bloco de menta, como o painel de fechamento da
  // página inicial, com o símbolo das três barras grande e esmaecido.
  return <div className="panel-page">
    <header className="panel-welcome">
      <h1>Olá, {firstName}.</h1>
      <p className="lead">Seu painel ainda está vazio. Ele se preenche com os extratos e as faturas que você enviar, e o envio de arquivos é o próximo recurso a ficar pronto.</p>
      <BarsMark className="panel-welcome-mark" />
    </header>

    <div className="panel-grid">
      <section className="panel-card panel-steps" aria-labelledby="steps-title">
        <h2 id="steps-title">Próximos passos</h2>
        <ol>
          {STEPS.map((step, index) => <StepItem key={step.title} step={step} number={index + 1} isNext={index === 0} />)}
        </ol>
      </section>

      <AccountSummary user={user} />
    </div>
  </div>;
}

type StepItemProps = {
  step: Step;
  number: number;
  isNext: boolean; // a etapa que vem logo a seguir ganha destaque
};

/** Uma etapa: o número, o título, a explicação e a situação. */
function StepItem({ step, number, isNext }: StepItemProps) {
  // Nenhuma etapa funciona ainda. A primeira é a que está sendo construída agora.
  let status = "Em breve";
  if (isNext) {
    status = "Em desenvolvimento";
  }

  // O número fica escondido dos leitores de tela porque a lista <ol> já é numerada.
  return <li className={isNext ? "is-next" : undefined}>
    <span className="panel-step-no" aria-hidden="true">{number}</span>
    <div>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
    </div>
    <p className="status-line"><i className="status-mark" aria-hidden="true" />{status}</p>
  </li>;
}

/**
 * Cartão lateral com fatos da conta que a barra lateral não mostra e uma nota
 * sobre a privacidade dos dados. O nome e o e-mail já estão no pé da barra.
 */
function AccountSummary({ user }: { user: User }) {
  // Este início só aparece enquanto não há arquivos; por isso "nenhum ainda".
  return <section className="panel-card panel-account-card" aria-labelledby="account-summary-title">
    <h2 id="account-summary-title">Sua conta</h2>
    <dl className="panel-facts">
      <div><dt>Conta criada em</dt><dd>{formatDate(user.created_at)}</dd></div>
      <div><dt>Arquivos enviados</dt><dd>Nenhum ainda</dd></div>
    </dl>
    <p className="panel-note">Nenhum outro usuário tem acesso aos seus dados. A senha fica guardada só como um código irreversível.</p>
    <a className="text-link" href="/app/account">Ver dados da conta</a>
  </section>;
}
