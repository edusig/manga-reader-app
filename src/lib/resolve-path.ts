export const resolvePath = (object: any, path: string, defaultValue: any) =>
  path.split('.').reduce((o, p) => (o[p] ? o[p] : defaultValue), object);
