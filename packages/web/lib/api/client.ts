export const readApiError = async (res: Response) => {
  const text = await res.text().catch(() => '');
  if (text) {
    try {
      const data = JSON.parse(text) as { error?: string };
      if (data.error) return data.error;
    } catch {
      return text;
    }
    return text;
  }
  return `Request failed (${res.status})`;
};

export const readJsonResponse = async <T>(res: Response): Promise<T> => (await res.json()) as T;
