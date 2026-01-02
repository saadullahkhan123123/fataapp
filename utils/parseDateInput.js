function parseDateInput(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string') {
    // PowerShell ConvertTo-Json emits: "/Date(1766053504958)/"
    const ms = value.match(/\/Date\((\d+)\)\//);
    if (ms && ms[1]) {
      const d = new Date(parseInt(ms[1], 10));
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

module.exports = { parseDateInput };


