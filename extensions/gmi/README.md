# Operator GMI Cloud Provider

Official Operator provider plugin for hosted GMI Cloud models through an
OpenAI-compatible API.

Install from Operator:

```bash
operator plugins install @gabrielvfonseca/gmi-provider
operator gateway restart
```

Configure a GMI Cloud API key, then select models with refs such as
`gmi/google/gemini-3.1-flash-lite`.
