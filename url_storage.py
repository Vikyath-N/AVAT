import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('urls.db')

# Create a cursor object to interact with the database
cursor = conn.cursor()

# Execute a SELECT query to retrieve data from the url_table
cursor.execute('SELECT * FROM url_table')

# Fetch all the rows as a list of tuples
rows = cursor.fetchall()

# Print the data
for row in rows:
    id, text, full_url = row
    print(f"ID: {id}, Text: {text}, Full URL: {full_url}")

# Close the database connection
conn.close()