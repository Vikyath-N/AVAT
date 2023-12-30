import sqlite3
import re

# Connect to the SQLite database
conn = sqlite3.connect('urls.db')

# Create a cursor object to interact with the database
cursor = conn.cursor()

# Execute a SELECT query to retrieve the full URLs from the database
cursor.execute('SELECT text FROM url_table')

# Fetch all the text descriptions as a list of tuples
texts = cursor.fetchall()

# Close the database connection
conn.close()

# Define a dictionary to store the frequency of extracted strings
text_frequency = {}

# Define a regular expression pattern to match date patterns
date_pattern = r'\s+\d+,\s+2023'

# Define a list of month names
months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

# Iterate through the text descriptions and extract the desired string
for text in texts:
    # Use regex to split the text using date pattern as separator
    parts = re.split(date_pattern, text[0])
    if parts:
        extracted_text = parts[0].strip()
        
        # Remove the month names
        for month in months:
            extracted_text = extracted_text.replace(month, '').strip()
        
        # Remove special characters, extra spaces, and normalize text
        extracted_text = re.sub(r'[^a-zA-Z0-9\s]', '', extracted_text)
        extracted_text = ' '.join(extracted_text.split())
        
        if extracted_text:
            # Handle specific edge cases
            if "Waymo 28 2023" in extracted_text:
                extracted_text = "Waymo"
            if "WeRide Corp" in extracted_text:
                extracted_text = "WeRide"
            
            # Update the text frequency
            if extracted_text in text_frequency:
                text_frequency[extracted_text] += 1
            else:
                text_frequency[extracted_text] = 1

# Print the frequency of extracted strings
for extracted_text, frequency in text_frequency.items():
    print(f"{extracted_text}: {frequency} times")
