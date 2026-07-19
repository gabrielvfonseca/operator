# Operator Amazon Bedrock Provider

Official Operator provider plugin for Amazon Bedrock. It adds Bedrock model discovery, text generation, embeddings, and guardrail-aware provider routing for agents that use AWS-hosted models.

Install from Operator:

```bash
operator plugin add @gabrielvfonseca/amazon-bedrock-provider
```

Configure AWS credentials and region through your normal Operator credential/profile setup, then select Bedrock models with the `amazon-bedrock/...` provider prefix.
