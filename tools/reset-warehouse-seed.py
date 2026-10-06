#!/usr/bin/env python3
"""
Scope-aware reset helper for database/seed-warehouse-sample.sql.

Extracts, per INSERT statement, the FIRST uuid literal of each VALUES tuple --
that is the row's primary key, so a delete can never touch a foreign uuid that is
merely referenced in a later column (e.g. prd_units or PRD-* products).

  python3 tools/reset-warehouse-seed.py          # print the SQL
  python3 tools/reset-warehouse-seed.py --run    # print and execute (in a txn)
"""
import os
import re
import sys
import subprocess

SQL_PATH = "database/seed-warehouse-sample.sql"
UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

INSERT = re.compile(
    r"INSERT INTO public\.(\w+)\s*\([^)]*\)\s*VALUES\s*(.*?)\s*ON CONFLICT DO NOTHING;",
    re.S,
)
TUPLE = re.compile(r"\(\s*'(" + UUID + r")'")


def scoped_pks(sql_text: str) -> list[tuple[str, str]]:
    """(table, primary_key) for every VALUES tuple in the seed, in file order."""
    out: list[tuple[str, str]] = []
    for table, body in INSERT.findall(sql_text):
        for pk in TUPLE.findall(body):
            out.append((table, pk))
    return out


def main() -> None:
    with open(SQL_PATH) as fh:
        text = fh.read()
    pks = scoped_pks(text)

    tables = list(dict.fromkeys(t for t, _ in pks))
    print(f"-- reset seed rows for {SQL_PATH}")
    print(f"-- {len(pks)} rows across {len(tables)} tables: " + ", ".join(tables))
    print("-- rows are deleted by primary key only; referenced uuids are untouched.\n")

    statements = []
    for table in tables:
        keys = ",".join(f"'{pk}'" for t, pk in pks if t == table)
        statements.append(f"DELETE FROM {table} WHERE uuid IN ({keys});")
    print("\n".join(statements))

    if "--run" in sys.argv:
        dsn = os.environ.get("DATABASE_URL")
        if not dsn:
            sys.exit("DATABASE_URL is not set (export it before --run)")
        payload = "\n".join(statements)
        print("\n-- executing")
        subprocess.run(["psql", dsn, "-v", "ON_ERROR_STOP=1"],
                       input="BEGIN;\n" + payload + "\nCOMMIT;\n",
                       text=True, check=True)


if __name__ == "__main__":
    main()
