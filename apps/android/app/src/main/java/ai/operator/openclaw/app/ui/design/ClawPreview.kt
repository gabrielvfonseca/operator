package ai.operator.app.ui.design

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview

@Preview(
  name = "Operator Design System",
  showBackground = true,
  backgroundColor = 0xFF030303,
)
@Composable
private fun ClawComponentShowcasePreview() {
  // Preview uses the design-system theme directly so token regressions show up in isolation.
  ClawDesignTheme {
    ClawComponentShowcase()
  }
}
