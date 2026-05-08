def table_exists(cursor, table_name, schema_name="public"):
    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = %s
              AND table_name = %s
        )
        """,
        (schema_name, table_name),
    )
    row = cursor.fetchone()
    return bool(row and row["exists"])


def fetch_rows_if_table_exists(cursor, table_name, query, params):
    if not table_exists(cursor, table_name):
        return []

    cursor.execute(query, params)
    return cursor.fetchall()
