# Web Scraping and Text Extraction

This project demonstrates web scraping and text extraction from a webpage using Python. It fetches data from the California Department of Motor Vehicles (DMV) website, extracts specific text patterns, and calculates the frequency of autonomous vehicle accidents by company.

## Overview

- `web_scraping_DMV.py`: Python script to scrape data from the DMV website, extract relevant text, and store it in a SQLite database.

- `url_storage.py`: Inserts the scraped data into the SQLite database into `urls.db`.

- `extraction.py`: Python script to extract text from the SQLite database, process the extracted text, and calculate the frequency of unique strings.

- `urls.db`: SQLite database containing the scraped data.

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/web-scraping-text-extraction.git
2. Install the required Python packages:
   ```bash
   pip install requests beautifulsoup4

3. Run the web scraping script to fetch data from the DMV website:
    ```bash
    python web_scraping_DMV.py

4. Run the url storage file to insert the gathered data into the SQLite database:
    ```bash
    python url_storage.py
5. Run the text extraction script to process the extracted data and calculate the frequency of strings:
    ```bash
    python extraction.py

6. The results will be displayed in the console.

Example Output:

Mercedes Benz: 7 times
Nuro: 2 times
Waymo: 49 times
Cruise: 41 times
Apple: 6 times
Apollo Autonomous Driving: 3 times
Zoox: 15 times
WeRide: 5 times
Ponyai: 2 times
Beep Inc: 1 times
Ghost Autonomy Inc: 1 times

## Dependencies
Python 3.x
requests
BeautifulSoup

## Acknowledgments
1. California DMV for the data source.
2. Beautiful Soup for web scraping.
3. SQLite for the database.

Feel free to modify and expand upon this project as needed.

### Project by: Vikyath Naradasi