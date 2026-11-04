export interface CapturedCredential {
  timestamp: string;
  username: string;
  password: string;
  ip: string;
}

export const capturedCredentials: CapturedCredential[] = [];

export function addCaptured(cred: Omit<CapturedCredential, 'timestamp'>): CapturedCredential {
  const record: CapturedCredential = {
    ...cred,
    timestamp: new Date().toISOString(),
  };
  capturedCredentials.unshift(record);
  return record;
}

export function clearCaptured(): void {
  capturedCredentials.length = 0;
}
