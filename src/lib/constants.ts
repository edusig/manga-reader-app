export const DEFAULT_DIRECTORIES_PATH = 'directories';

export const SQLITE_DB = 'imageGallery.db';

export const CHECK_DIRS_TABLE_QUERY =
  "SELECT name FROM sqlite_master WHERE type='table' AND name=?;";
export const INITIALIZE_DB_QUERY = [
  `
CREATE TABLE IF NOT EXISTS directory(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR NOT NULL,
  path VARCHAR NOT NULL,
  dirs_count INTEGER NOT NULL,
  files_count INTEGER NOT NULL,
  last_read_at DATETIME,
  last_read_chapter INTEGER,
  last_read_page INTEGER,
  manga_id INTEGER,
  FOREIGN KEY(manga_id) REFERENCES manga(id),
  FOREIGN KEY(last_read_chapter) REFERENCES chapter(id)
  FOREIGN KEY(last_read_page) REFERENCES page(id)
);`,
  `
CREATE TABLE IF NOT EXISTS chapter(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  path VARCHAR NOT NULL,
  directory_id INTEGER NOT NULL,
  FOREIGN KEY(directory_id) REFERENCES directory(id)
);`,
  `
CREATE TABLE IF NOT EXISTS page(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  path VARCHAR NOT NULL,
  chapter_id INTEGER NOT NULL,
  FOREIGN KEY(chapter_id) REFERENCES chapter(id)
);`,
  `
CREATE TABLE IF NOT EXISTS manga(
  id INTEGER PRIMARY KEY,
  id_mal INTEGER,
  title VARCHAR,
  status VARCHAR,
  description VARCHAR,
  chapters INTEGER,
  cover_xlarge VARCHAR,
  cover_large VARCHAR,
  cover_medium VARCHAR,
  cover_color VARCHAR,
  banner VARCHAR,
  genres VARCHAR,
  synonyms VARCHAR,
  average_score INTEGER,
  favorites INTEGER,
  site_url VARCHAR
);`,
  `
CREATE TABLE IF NOT EXISTS download_queue(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error INTEGER NOT NULL,
  page_id INTEGER NOT NULL,
  api_url VARCHAR NOT NULL,
  FOREIGN KEY(page_id) REFERENCES page(id)
);
`,
];
export const DROP_TABLES_QUERY = 'DROP TABLE IF EXISTS ?';

export const ADD_DIR_QUERY = `INSERT INTO directory(name, path, dirs_count, files_count) VALUES(?,?,?,?);`;
export const ADD_CHAPTER_QUERY = `INSERT INTO chapter(name, path, directory_id) VALUES(?,?,?);`;
export const ADD_PAGE_QUERY = `INSERT INTO page(name, path, chapter_id) VALUES(?,?,?);`;
export const ADD_DOWNLOAD_QUEUE_QUERY = `INSERT INTO download_queue(error, page_id, api_url) VALUES(?,?,?);`;

export const DIR_QUERY = `
SELECT 
(
  SELECT count(page.path)
  FROM download_queue 
  INNER JOIN page ON download_queue.page_id=page.id
  INNER JOIN chapter ON page.chapter_id=chapter.id
  INNER JOIN directory as dir ON chapter.directory_id=dir.id
  WHERE dir.id=directory.id
) as downloads_left,
directory.id,
directory.name,
directory.path,
directory.dirs_count,
directory.files_count
FROM directory
ORDER BY last_read_at DESC, name ASC
`;

export const DOWNLOAD_QUEUE_QUERY = `SELECT * FROM download_queue WHERE error=0;`;
