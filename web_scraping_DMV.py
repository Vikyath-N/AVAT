import requests
from bs4 import BeautifulSoup
import sqlite3

# URL of the website you want to visit
url = 'https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/autonomous-vehicle-collision-reports/'  # Replace with the actual URL

# Send a GET request to the URL
response = requests.get(url)

# Check if the request was successful (status code 200)
if response.status_code == 200:
    # Parse the HTML content of the page using Beautiful Soup
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the accordion block for the year 2023
    accordion_2023 = soup.find('div', id='acc-2023')

    # Check if the accordion block for 2023 exists
    if accordion_2023:
        # Find all <a> tags within the accordion block
        links = accordion_2023.find_all('a')

        # Extract and insert the URLs into the database
        base_url = 'https://www.dmv.ca.gov/'
        conn = sqlite3.connect('urls.db')
        cursor = conn.cursor()

        # Check if the url_table exists, and create it if it doesn't
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS url_table (
                id INTEGER PRIMARY KEY,
                text TEXT,
                full_url TEXT
            )
        ''')

        # Clear existing data from url_table
        cursor.execute('DELETE FROM url_table')

        for link in links:
            href = link.get('href')
            text = link.get_text()
            full_url = base_url + href

            # Insert the URL into the database
            cursor.execute('INSERT INTO url_table (text, full_url) VALUES (?, ?)', (text, full_url))

        # Commit the changes and close the database connection
        conn.commit()
        conn.close()

        print("URLs inserted into the database.")
    else:
        print("Accordion block for 2023 not found.")
else:
    print(f"Failed to retrieve the page. Status code: {response.status_code}")
