export type IntegrationGuide = {
  steps: string[];
  url: string;
  urlLabel: string;
  keyName: string;
};

export const INTEGRATION_GUIDES: Record<string, IntegrationGuide> = {
  xero: {
    keyName: "Custom Connection client secret",
    url: "https://developer.xero.com/app/manage",
    urlLabel: "Xero Developer portal",
    steps: [
      "Open Xero Developer portal and sign in with your Xero admin account.",
      "Click New app → choose Custom connection, name it 'Quantix Prime'.",
      "Select the Accounting scope (read & write invoices, POs, contacts).",
      "On the app page click Generate a secret and copy the value shown once.",
    ],
  },
  qb: {
    keyName: "OAuth client secret",
    url: "https://developer.intuit.com/app/developer/dashboard",
    urlLabel: "Intuit Developer dashboard",
    steps: [
      "Sign in to the Intuit Developer dashboard with your QuickBooks owner account.",
      "Create a new app → select Accounting API.",
      "Open Keys & OAuth → Production, then copy the Client Secret.",
      "Paste the secret here. Account = the QuickBooks company name.",
    ],
  },
  sage: {
    keyName: "API access token",
    url: "https://developer.sage.com/api/accounting/",
    urlLabel: "Sage developer docs",
    steps: [
      "In Sage 50, go to Settings → User Management → Integrations.",
      "Enable API access and click Generate token.",
      "Copy the token (it is shown only once).",
      "Use your company file name as the Account value.",
    ],
  },
  asta: {
    keyName: "Powerproject API key",
    url: "https://www.elecosoft.com/support/powerproject/",
    urlLabel: "Elecosoft support portal",
    steps: [
      "Open Asta Powerproject → File → Options → Integrations.",
      "Click Enable web API and sign in with your Elecosoft account.",
      "Press Generate API key, give it the name 'Quantix Prime'.",
      "Copy the key — it disappears as soon as you close the dialog.",
    ],
  },
  msp: {
    keyName: "Azure AD app secret",
    url: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps",
    urlLabel: "Azure App registrations",
    steps: [
      "In Azure Portal go to App registrations → New registration.",
      "Name it 'Quantix Prime' and add the Project.Read.All API permission.",
      "Open Certificates & secrets → New client secret, set expiry to 24 months.",
      "Copy the Value (not the Secret ID) immediately after saving.",
    ],
  },
  procore: {
    keyName: "OAuth 2.0 client secret",
    url: "https://developers.procore.com/developer_portal/applications",
    urlLabel: "Procore Developer portal",
    steps: [
      "Sign in to the Procore Developer portal with your company admin.",
      "Create a new App → Server-to-server, scope to your company.",
      "Open Configuration → OAuth credentials and copy the Client Secret.",
      "Use your Procore Company ID as the Account value.",
    ],
  },
  slack: {
    keyName: "Bot User OAuth Token",
    url: "https://api.slack.com/apps",
    urlLabel: "Slack API apps",
    steps: [
      "Open api.slack.com/apps and click Create New App → From scratch.",
      "Add scopes chat:write and channels:read under OAuth & Permissions.",
      "Install the app to your workspace, then copy the Bot User OAuth Token (starts with xoxb-).",
      "Account = your workspace URL, e.g. acme-construction.slack.com.",
    ],
  },
  teams: {
    keyName: "Incoming Webhook URL",
    url: "https://learn.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
    urlLabel: "Microsoft Teams docs",
    steps: [
      "In Teams, open the channel you want notifications in.",
      "Click ··· → Connectors → Incoming Webhook → Configure.",
      "Name it 'Quantix Prime' and click Create, then copy the webhook URL.",
      "Paste the full URL as the API key. Account = the channel name.",
    ],
  },
};