# Scripts de verificação

Com o frontend local em execução, rode os testes atuais:

```bash
python scripts/frontend/check_front_experience.py
python scripts/frontend/check_front_experience_a11y.py
python scripts/frontend/check_carousel.py
python scripts/frontend/check_dashboard.py
```

Defina `GERENCIA_TEST_URL` se o servidor não estiver em `http://127.0.0.1:5173`. As dependências locais de Playwright e axe ficam em `.audit-tools/` e `.audit-tools-js/`.
