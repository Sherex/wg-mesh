
-- Contains all nodes in the network
CREATE TABLE node
(
  id         INTEGER NOT NULL UNIQUE,
  -- If empty hostname is used
  name       TEXT    NULL    ,
  -- linux | macos | windows
  platform   TEXT    NOT NULL DEFAULT linux,
  -- ISO8601
  last_alive TEXT    NULL    ,
  -- ISO8601
  joined_at  TEXT    NULL    ,
  PRIMARY KEY (id AUTOINCREMENT)
);

-- Contains access tokens for nodes
CREATE TABLE access_token
(
  node_id       INTEGER NOT NULL,
  token_hash    TEXT    NOT NULL UNIQUE,
  -- bool
  is_join_token INTEGER NOT NULL DEFAULT 0,
  -- ISO8601
  last_used     TEXT    NULL    ,
  FOREIGN KEY (node_id) REFERENCES node (id)
);

-- A node's IPs
CREATE TABLE ip
(
  node_id INTEGER NOT NULL,
  ip      TEXT    NOT NULL,
  subnet  TEXT    NOT NULL,
  FOREIGN KEY (node_id) REFERENCES node (id)
);
