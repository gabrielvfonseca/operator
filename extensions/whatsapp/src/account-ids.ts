// Whatsapp plugin module implements account ids behavior.
import { createAccountListHelpers } from "@gabrielvfonseca/operator/plugin-sdk/account-core";

const {
  listConfiguredAccountIds,
  listAccountIds,
  resolveDefaultAccountId: resolveDefaultWhatsAppAccountId,
} = createAccountListHelpers("whatsapp", {
  implicitDefaultAccount: {
    channelKeys: ["authDir"],
  },
});

export {
  listConfiguredAccountIds,
  listAccountIds as listWhatsAppAccountIds,
  resolveDefaultWhatsAppAccountId,
};
