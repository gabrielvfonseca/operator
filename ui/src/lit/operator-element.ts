import { LitElement } from "lit";
import { I18nController } from "../i18n/lib/lit-controller.ts";

/** Lit base that refreshes the element when the active locale changes. */
export abstract class OperatorLitElement extends LitElement {
  protected readonly i18nController = new I18nController(this);
}

/** Operator Lit base for components styled by the shared light-DOM stylesheet. */
export abstract class OperatorLightDomElement extends OperatorLitElement {
  override createRenderRoot() {
    return this;
  }
}

/** Light-DOM element whose host should not add a layout box around its render output. */
export abstract class OperatorLightDomContentsElement extends OperatorLightDomElement {
  override connectedCallback() {
    super.connectedCallback();
    this.style.display = "contents";
  }
}
