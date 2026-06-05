export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      width?: number;
    }
  ) => void;
}

export interface GoogleAccounts {
  id: GoogleAccountsId;
}

export interface GoogleGsi {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleGsi;
  }
}
