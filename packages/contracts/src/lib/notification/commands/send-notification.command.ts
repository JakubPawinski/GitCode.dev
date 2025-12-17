export class SendNotificationCommand {
  constructor(
    // Kto ma dostać (niezbędne)
    public readonly userId: string,

    // Typ powiadomienia (np. 'SYSTEM', 'MARKETING' - ważne dla filtrów w bazie)
    public readonly type: string,

    // Treść dla użytkownika
    public readonly title: string,
    public readonly message: string,

    // Opcjonalne: metadata (np. link do przekierowania, ID obiektu)
    // Używamy Record<string, any> bo to uniwersalny JSON
    public readonly payload?: Record<string, any>,
  ) {}
}