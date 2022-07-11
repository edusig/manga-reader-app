export const camelCaseToSlug = (input: string) =>
  input.replace(/[A-Z]/g, (m) => `-${m.toLocaleLowerCase()}`);

export const slugify = (path: string) =>
  camelCaseToSlug(
    path.at(0)?.toLocaleLowerCase() + path.slice(1).replace(/[^0-9a-zA-Z\-\.\(\)]/gi, ''),
  );
