// ============================================
// wrapper דקיק סביב fetch לקריאות API
// ============================================
// מציע api.get / api.post שזורקים שגיאה עם הודעה בעברית.
// משתמשים: const data = await api.post('/api/orders', body);
// ============================================
(function () {
  async function request(method, path, body) {
    const opts = {
      method,
      headers: { 'Accept': 'application/json' },
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(path, opts);
    } catch (e) {
      throw new ApiError('שגיאת רשת - בדוק את החיבור', 0);
    }

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch { /* ignore */ }
    }

    if (!res.ok) {
      const msg = data?.error || `שגיאת שרת (${res.status})`;
      throw new ApiError(msg, res.status, data?.field);
    }
    return data;
  }

  class ApiError extends Error {
    constructor(message, status, field) {
      super(message);
      this.status = status;
      this.field = field;
    }
  }

  window.api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    ApiError,
  };
})();
