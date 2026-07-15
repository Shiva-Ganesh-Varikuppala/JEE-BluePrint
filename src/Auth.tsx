export async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jee-token');
  const isForm = options.body instanceof FormData;

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || 'Something went wrong.');
  }

  return body;
}