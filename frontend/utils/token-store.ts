// GitCode.dev/frontend/utils/token-store.ts
class TokenStore {
  private static accessToken: string | null = null;

  static setToken(token: string) {
    this.accessToken = token;
  }

  static getToken(): string | null {
    return this.accessToken;
  }

  static clear() {
    this.accessToken = null;
  }

  static hasToken(): boolean {
    return !!this.accessToken;
  }
}

export default TokenStore;